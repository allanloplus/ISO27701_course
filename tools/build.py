#!/usr/bin/env python3
"""Build site data from content/chapters/*.json.

- site/data/catalog.js : chapter list (for menus)
- site/data/chNN.js    : full chapter data (loaded on demand by text/video pages)
- site/audio/chNN/*.mp3: per-line TTS audio (with --tts)

Usage:
  python3 tools/build.py            # data only
  python3 tools/build.py --tts      # data + generate missing audio
"""
import asyncio
import glob
import hashlib
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "chapters")
SITE = os.path.join(ROOT, "site")
DATA = os.path.join(SITE, "data")
AUDIO = os.path.join(SITE, "audio")

VOICES = {
    # Allan：台灣男聲；阿拉蕾：年輕可愛女聲（略提高音調與語速）
    "allan": dict(voice="zh-TW-YunJheNeural", rate="+0%", pitch="+0Hz"),
    "arale": dict(voice="zh-TW-HsiaoYuNeural", rate="+6%", pitch="+12Hz"),
}

SPELL = {"PIMS": "P I M S", "ISMS": "I S M S", "SoA": "S O A", "DSAR": "D S A R",
         "PIA": "P I A", "DPIA": "D P I A", "RoPA": "RoPA", "KPI": "K P I", "DPA": "D P A",
         "SaaS": "SaaS", "HR": "H R", "IT": "I T", "MIS": "M I S", "DPO": "D P O",
         "NDA": "N D A", "CIA": "C I A", "IEC": "I E C"}
DIGITS = "零一二三四五六七八九"


def speakable(text: str) -> str:
    t = text
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    # ISO 標準編號逐字念：27701 → 二七七零一（不影響 4 位數年份）
    t = re.sub(r"(?<![\d.])([12]\d{4})(?![\d])", lambda m: "".join(DIGITS[int(c)] for c in m.group(1)), t)
    # 條號中的點：6.1.2 → 6點1點2
    t = re.sub(r"(?<=[\dA-Z])\.(?=\d)", "點", t)
    for k, v in SPELL.items():
        t = re.sub(r"(?<![A-Za-z])" + k + r"(?![A-Za-z])", v, t)
    t = t.replace("/", "、").replace("～", "").replace("~", "")
    return t


def audio_name(ch, si, li, who, text):
    h = hashlib.md5((who + "|" + text).encode()).hexdigest()[:6]
    return f"audio/{ch}/{si:02d}-{li:02d}-{h}.mp3"


def load_chapters():
    chs = []
    for f in sorted(glob.glob(os.path.join(CONTENT, "ch*.json"))):
        with open(f, encoding="utf-8") as fp:
            chs.append(json.load(fp))
    chs.sort(key=lambda c: c["no"])
    return chs


def mp3_duration(path):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "default=nw=1:nk=1", path], capture_output=True, text=True).stdout
        return round(float(out.strip()), 2)
    except Exception:
        return None


async def tts_all(jobs):
    import certifi
    certifi.where = lambda: os.environ.get("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt")
    import edge_tts
    proxy = os.environ.get("HTTPS_PROXY")
    sem = asyncio.Semaphore(int(os.environ.get("TTS_CONCURRENCY", "12")))
    failed = []

    async def one(path, who, text):
        async with sem:
            v = VOICES[who]
            tmp = path + ".part"
            for attempt in range(12):
                try:
                    await edge_tts.Communicate(speakable(text), v["voice"], rate=v["rate"],
                                               pitch=v["pitch"], proxy=proxy).save(tmp)
                    if os.path.getsize(tmp) > 1000:
                        os.replace(tmp, path)
                        return
                except Exception:
                    pass
                await asyncio.sleep(1 + attempt * 0.5)
            failed.append(path)

    await asyncio.gather(*(one(*j) for j in jobs))
    return failed


def main():
    do_tts = "--tts" in sys.argv
    os.makedirs(DATA, exist_ok=True)
    chs = load_chapters()
    jobs = []
    catalog = []
    for c in chs:
        cid = c["id"]
        os.makedirs(os.path.join(AUDIO, cid), exist_ok=True)
        nlines = 0
        for si, sc in enumerate(c.get("video", {}).get("scenes", []), 1):
            for li, ln in enumerate(sc.get("lines", []), 1):
                rel = audio_name(cid, si, li, ln["who"], ln["text"])
                ln["a"] = rel
                full = os.path.join(SITE, rel)
                if not os.path.exists(full):
                    jobs.append((full, ln["who"], ln["text"]))
                nlines += 1
        catalog.append({k: c.get(k) for k in ("id", "no", "title", "short", "clauses", "minutes", "objectives")}
                       | {"scenes": len(c.get("video", {}).get("scenes", [])), "lines": nlines})
        c["_chapter"] = True

    if do_tts and jobs:
        print(f"TTS: {len(jobs)} lines to synthesize")
        failed = asyncio.run(tts_all(jobs))
        if failed:
            print("FAILED:", len(failed))
            for f in failed[:20]:
                print("  ", f)

    # durations + clean stale audio
    for c in chs:
        keep = set()
        for sc in c.get("video", {}).get("scenes", []):
            for ln in sc.get("lines", []):
                full = os.path.join(SITE, ln["a"])
                keep.add(os.path.basename(full))
                if os.path.exists(full):
                    ln["d"] = mp3_duration(full)
                else:
                    ln.pop("a")  # player falls back to speech synthesis / timed text
        d = os.path.join(AUDIO, c["id"])
        for f in os.listdir(d):
            if f.endswith(".mp3") and f not in keep:
                os.remove(os.path.join(d, f))
        c.pop("_chapter", None)
        with open(os.path.join(DATA, c["id"] + ".js"), "w", encoding="utf-8") as fp:
            fp.write("window.__CH=window.__CH||{};window.__CH[%s]=%s;\n" % (
                json.dumps(c["id"]), json.dumps(c, ensure_ascii=False, separators=(",", ":"))))
        for cat in catalog:
            if cat["id"] == c["id"]:
                cat["seconds"] = round(sum(ln.get("d") or 0 for sc in c.get("video", {}).get("scenes", [])
                                           for ln in sc.get("lines", [])))

    with open(os.path.join(DATA, "catalog.js"), "w", encoding="utf-8") as fp:
        fp.write("window.CATALOG=%s;\n" % json.dumps(catalog, ensure_ascii=False, indent=1))
    print(f"built {len(chs)} chapters")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""產生客戶授權版（放在企業內部網站使用）。

公開版（GitHub）的 site/assets/license.js 為 null，網頁不顯示任何授權資訊；
本工具會複製一份課程網站，寫入該客戶的授權資訊後打包成 zip，原始專案不會被修改。

用法（在專案根目錄執行）：
  python3 tools/make_license_package.py --company "○○股份有限公司" --no L-2026-001 \
      --start 2026-11-01 --end 2027-10-31 --domains elearning.example.com,intranet.example.com

參數：
  --company  授權公司名稱（必填）       --dept     授權單位（選填）
  --no       授權編號                   --start/--end  授權期間（YYYY-MM-DD；不填 end = 永久）
  --domains  授權網域，逗號分隔（選填；網站放在其他網域時頁面會顯示提醒）
  --note     授權用途（預設：內部教育訓練使用）
  --pptx     一併附上講師簡報 PPTX（預設不附）
  --source   一併附上內容原始檔與建置工具（content/chapters、tools/build.py，預設不附）
  --out      輸出資料夾（預設：專案根目錄的 dist/）

網頁顯示位置：頁首授權標籤、首頁「○○ 內部教育訓練專用」、每頁頁尾授權說明、結業證書「授權單位」與測驗解答。
授權到期或網域不符時，頁面頂端會顯示紅色提醒。
注意：ISO 標準原文 PDF 受著作權保護，永遠不會放進授權版。
"""
import argparse, datetime, json, os, re, shutil, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CUSTOMER_README = """# ISO/IEC 27701:2025 隱私資訊管理系統（PIMS）線上課程（授權版）

授權公司：{company}{dept}
授權編號：{no}
授權期間：{period}
授權用途：{note}
{domains}
## 架設方式
1. **先將 zip 檔「全部解壓縮」**（在 zip 檔上按右鍵 →「全部解壓縮…」）。
   請勿直接在壓縮檔中點開 index.html，否則樣式、圖片與程式不會一起載入，畫面會無法正常顯示。
2. 把解壓縮後資料夾內的全部內容上傳到企業內部網站（IIS、Nginx、Apache 或任何靜態網站空間皆可），
   以瀏覽器開啟 `index.html`（會自動導向 `site/index.html`）即可；
   也可以直接在電腦上雙擊解壓縮後的 `site/index.html` 使用，不需要伺服器。

- 線上文字教材：`site/text.html`
- 互動影音教材：`site/video.html`
- 課後測驗與結業證書：`site/quiz.html`（題目在 `site/assets/quiz-data.js`）

## 授權說明
本教材經授權供上述公司{note}。授權資訊記載於 `site/assets/license.js`，請勿修改或移除；
未經授權，請勿轉載、複製或對外公開。授權續約或擴充請洽 Allan Lo顧問（http://www.123hi.org）。

本課程依 ISO/IEC 27701:2025 編製，標準條文以精要改寫方式呈現，條文解釋以 ISO/IEC 英文原文為唯一依據；
本教材不含標準原文，貴公司如需標準全文，請向 ISO 或其授權經銷商購買。

---
教材規劃製作：Allan Lo顧問（http://www.123hi.org）
Copyright © 2026 Allan Lo. All rights reserved.
"""


def valid_date(s):
    if not s:
        return ""
    datetime.date.fromisoformat(s)
    return s


def main():
    ap = argparse.ArgumentParser(description="產生客戶授權版")
    ap.add_argument("--company", required=True)
    ap.add_argument("--dept", default="")
    ap.add_argument("--no", default="")
    ap.add_argument("--start", default=datetime.date.today().isoformat(), type=valid_date)
    ap.add_argument("--end", default="", type=valid_date)
    ap.add_argument("--domains", default="")
    ap.add_argument("--note", default="內部教育訓練使用")
    ap.add_argument("--pptx", action="store_true")
    ap.add_argument("--source", action="store_true")
    ap.add_argument("--out", default=os.path.join(ROOT, "dist"))
    a = ap.parse_args()

    no = a.no or "L-" + datetime.date.today().strftime("%Y%m%d")
    lic = {"company": a.company.strip(), "dept": a.dept.strip(), "no": no, "start": a.start, "end": a.end,
           "domains": [d.strip().lower() for d in a.domains.split(",") if d.strip()], "note": a.note.strip()}
    safe = re.sub(r'[\\/:*?"<>|\s]+', "_", lic["company"])
    name = f"ISO27701_PIMS_授權版_{safe}_{no}"
    os.makedirs(a.out, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        dst = os.path.join(td, name)
        os.makedirs(dst)
        # 白名單：只放客戶需要的檔案（標準 PDF、講師工具、node_modules 一律不放）
        shutil.copytree(os.path.join(ROOT, "site"), os.path.join(dst, "site"),
                        ignore=shutil.ignore_patterns("*.part", ".DS_Store"))
        shutil.copy2(os.path.join(ROOT, "index.html"), dst)
        if a.pptx:
            shutil.copytree(os.path.join(ROOT, "slides"), os.path.join(dst, "slides"))
        if a.source:
            shutil.copytree(os.path.join(ROOT, "content", "chapters"), os.path.join(dst, "content", "chapters"))
            os.makedirs(os.path.join(dst, "tools"))
            shutil.copy2(os.path.join(ROOT, "tools", "build.py"), os.path.join(dst, "tools"))

        with open(os.path.join(dst, "site", "assets", "license.js"), "w", encoding="utf-8") as f:
            f.write("/* 授權資訊：請勿修改或移除。授權續約請洽 Allan Lo顧問（http://www.123hi.org） */\n")
            f.write("window.COURSE_LICENSE = " + json.dumps(lic, ensure_ascii=False, indent=1) + ";\n")
        period = f"{lic['start']} ～ {lic['end']}" if lic["end"] else f"{lic['start']} 起"
        with open(os.path.join(dst, "README_授權版.md"), "w", encoding="utf-8") as f:
            f.write(CUSTOMER_README.format(company=lic["company"], dept=("　" + lic["dept"]) if lic["dept"] else "",
                                           no=no, period=period, note=lic["note"],
                                           domains=("授權網域：" + "、".join(lic["domains"]) + "\n") if lic["domains"] else ""))
        zpath = os.path.join(a.out, name + ".zip")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            for base, _, files in os.walk(dst):
                for fn in files:
                    full = os.path.join(base, fn)
                    z.write(full, os.path.relpath(full, td))
    size = os.path.getsize(zpath) / 1e6
    print(f"已產生授權版：{zpath}（{size:.1f} MB）")
    print(f"授權公司：{lic['company']}｜編號：{no}｜期間：{period}" + (f"｜網域：{', '.join(lic['domains'])}" if lic["domains"] else ""))


if __name__ == "__main__":
    main()

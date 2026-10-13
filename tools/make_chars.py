#!/usr/bin/env python3
"""從講師提供的角色設定圖（Allan、阿拉蕾）裁切網站與簡報用人物圖。
用法：python3 tools/make_chars.py <Allan設定圖> <阿拉蕾設定圖>
"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "site", "assets", "img")
PPT = os.path.join(ROOT, "tools", "img")

A = Image.open(sys.argv[1]).convert("RGB")
R = Image.open(sys.argv[2]).convert("RGB")
# 清除裁切範圍內的雜訊（標題字、分隔線）
d = ImageDraw.Draw(A); d.rectangle((758, 730, 800, 805), fill="white")
d = ImageDraw.Draw(R); d.rectangle((60, 138, 282, 145), fill="white"); d.rectangle((303, 138, 470, 145), fill="white")

POSES = {  # 半身／全身
    "allan_half": (A, (40, 80, 772, 905)),
    "allan_full": (A, (40, 80, 772, 1475)),
    "arale_half": (R, (85, 128, 450, 560)),
    "arale_full": (R, (85, 128, 450, 752)),
}
EXPR = {  # 表情包（胸像）
    "allan": {"smile": (765, 795, 1025, 1120), "laugh": (1075, 795, 1335, 1120), "think": (1380, 795, 1645, 1120),
              "confused": (1640, 795, 1970, 1120), "surprised": (765, 1135, 1025, 1465), "point": (1045, 1135, 1335, 1465),
              "wink": (1380, 1135, 1645, 1465), "talk": (1700, 1135, 1960, 1465)},
    "arale": {"laugh": (441, 811, 793, 1111), "think": (826, 811, 1179, 1111), "surprised": (1213, 811, 1566, 1111),
              "confused": (1598, 811, 1951, 1111), "talk": (441, 1146, 793, 1446), "sad": (826, 1146, 1179, 1446),
              "thumb": (1213, 1146, 1566, 1446), "excited": (1598, 1146, 1951, 1446)},
}

def save(im, name, web_max, ppt=False):
    w = im.copy(); w.thumbnail(web_max, Image.LANCZOS)
    w.save(os.path.join(WEB, name + ".webp"), quality=84)
    if ppt:
        p = im.copy(); p.thumbnail((900, 1400), Image.LANCZOS)
        p.save(os.path.join(PPT, name + ".jpg"), quality=88)

os.makedirs(WEB, exist_ok=True); os.makedirs(PPT, exist_ok=True)
for n, (src, box) in POSES.items():
    save(src.crop(box), n, (520, 760), ppt=True)
for who, faces in EXPR.items():
    for e, box in faces.items():
        save((A if who == "allan" else R).crop(box), f"{who}_{e}", (260, 260), ppt=True)
print("ok")

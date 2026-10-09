// 產生講師實體課用簡報：node tools/make_pptx.js
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "slides", "ISO27701_2025_PIMS_講師簡報.pptx");
const IMG = { allan: path.join(__dirname, "img", "allan.jpg"), arale: path.join(__dirname, "img", "arale.jpg") };
const SKILL_THEME = process.env.APPLY_THEME; // path to apply_theme.js (optional)

const THEME = {
  name: "PIMS Navy",
  headFontFace: "Microsoft JhengHei",
  bodyFontFace: "Microsoft JhengHei",
  colors: {
    dk1: "1B2340", lt1: "FFFFFF", dk2: "1E2761", lt2: "EEF2FA",
    accent1: "0F8B8D", accent2: "E8559A", accent3: "F2A541", accent4: "2B5BD7",
    accent5: "6B7A99", accent6: "1F9D55", hlink: "2B5BD7", folHlink: "6B7A99",
  },
};
const HEX = THEME.colors;

const chapters = fs.readdirSync(path.join(ROOT, "content", "chapters"))
  .filter((f) => /^ch\d+\.json$/.test(f)).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", "chapters", f), "utf8")))
  .sort((a, b) => a.no - b.no);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "ISO/IEC 27701:2025 隱私資訊管理系統（PIMS）";
pres.author = "Allan";
pres.subject = "ISO/IEC 27701:2025 標準解說、PIMS 管理作法與稽核實務";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- 版面配置（layouts） ----------
pres.defineSlideMaster({
  title: "DARK_TITLE",
  background: { color: HEX.dk2 },
  objects: [],
});
pres.defineSlideMaster({
  title: "SECTION",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.55, w: 7.6, h: 1.6, fontSize: 36, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.3, w: 7.6, h: 1.4, fontSize: 18, color: "CADCFC", valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: HEX.lt1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 30, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: "ISO/IEC 27701:2025 PIMS｜講師 Allan", options: { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: HEX.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: HEX.accent5, align: "right" },
});

const shadow = () => ({ type: "outer", color: "1B2340", opacity: 0.18, blur: 8, offset: 3, angle: 90 });

function portrait(slide, who, x, y, w, name) {
  const h = who === "allan" ? w * 1.55 : w * 1.33;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.18, fill: { color: HEX.lt1 }, line: { color: who === "allan" ? HEX.accent3 : HEX.accent2, width: 3 }, shadow: shadow(), objectName: `${who}-frame` });
  slide.addImage({ path: IMG[who], x, y, w, h, sizing: { type: "cover", w, h }, altText: who === "allan" ? "Allan 講師" : "助教阿拉蕾", objectName: `${who}-img` });
  if (name) slide.addText(name, { x: x - 0.2, y: y + h + 0.12, w: w + 0.4, h: 0.35, align: "center", fontSize: 13, bold: true, color: who === "allan" ? HEX.accent3 : HEX.accent2, isTextBox: true, margin: 0 });
  return h;
}

function bubble(slide, text, x, y, w, h, who) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.15, fill: { color: who === "allan" ? "FFF4E0" : "FDE7F1" }, line: { color: who === "allan" ? HEX.accent3 : HEX.accent2, width: 1.5 }, objectName: "bubble" });
  slide.addText(text, { x: x + 0.12, y, w: w - 0.24, h, fontSize: 14, color: C.text1, valign: "middle", isTextBox: true, margin: 0 });
}

// ---------- 1. 封面 ----------
{
  const s = pres.addSlide({ masterName: "DARK_TITLE" });
  s.addText("ISO/IEC 27701:2025", { x: 0.8, y: 1.3, w: 7.4, h: 0.7, fontSize: 24, bold: true, color: "CADCFC", isTextBox: true, margin: 0 });
  s.addText("隱私資訊管理系統（PIMS）", { x: 0.8, y: 2.0, w: 7.6, h: 1.0, fontSize: 40, bold: true, color: HEX.lt1, isTextBox: true, margin: 0 });
  s.addText("標準解說 × 管理作法 × 稽核實務", { x: 0.8, y: 3.0, w: 7.6, h: 0.7, fontSize: 24, color: HEX.accent3, isTextBox: true, margin: 0 });
  s.addText([
    { text: "講師：Allan（ISMS／PIMS 輔導顧問・驗證機構稽核員）", options: { breakLine: true } },
    { text: "助教：阿拉蕾" },
  ], { x: 0.8, y: 4.4, w: 7.4, h: 0.9, fontSize: 16, color: "CADCFC", isTextBox: true, margin: 0, paraSpaceAfter: 6 });
  s.addText("2025 新版・可獨立驗證的 PIMS 標準", { x: 0.8, y: 5.8, w: 4.6, h: 0.45, fontSize: 14, bold: true, color: HEX.dk2, fill: { color: HEX.accent3 }, align: "center", isTextBox: true, margin: 0, rectRadius: 0.1, shape: pres.shapes.ROUNDED_RECTANGLE });
  portrait(s, "arale", 8.55, 3.0, 1.9, "助教 阿拉蕾");
  portrait(s, "allan", 10.75, 1.1, 2.0, "Allan 講師");
  s.addNotes("開場：歡迎學員，自我介紹（ISMS/PIMS 輔導顧問、驗證機構稽核員，專長資安與企業 MIS 管理）。介紹助教阿拉蕾會在線上影音陪大家學習。說明本課程三大面向：標準詳細解說、PIMS 管理作法、常見稽核實務。提醒學員課後可到線上文字教材與互動影音複習，完成 10 題課後測驗（80 分及格）可下載結業證書。");
}

// ---------- 2. 課程議程（3 小時） ----------
const teach = chapters.filter((c) => (c.slides || []).length);
const totalSlides = teach.reduce((a, c) => a + c.slides.length + 1, 0);
const TEACH_MIN = 170; // 180 分鐘扣除 10 分鐘休息
let acc = 0;
const plan = teach.map((c) => {
  const m = Math.max(5, Math.round(((c.slides.length + 1) / totalSlides) * TEACH_MIN / 5) * 5);
  acc += m; return { c, m };
});
{
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText("課程地圖與時間配置（約 3 小時）", { placeholder: "title" });
  const half = Math.ceil(plan.length / 2);
  [plan.slice(0, half), plan.slice(half)].forEach((col, ci) => {
    const x = 0.6 + ci * 6.15;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.45, w: 5.95, h: 5.35, rectRadius: 0.12, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, objectName: `agenda-card-${ci}` });
    const rows = col.map(({ c, m }) => [
      { text: String(c.no), options: { bold: true, color: HEX.accent4, align: "center" } },
      { text: c.title, options: { color: HEX.dk1 } },
      { text: `${m} 分`, options: { color: HEX.accent5, align: "right" } },
    ]);
    s.addTable(rows, { x: x + 0.15, y: 1.6, w: 5.65, colW: [0.45, 4.3, 0.9], fontSize: 14, fontFace: THEME.bodyFontFace, rowH: 0.5, border: { type: "none" }, valign: "middle", margin: [2, 4, 2, 4] });
  });
  s.addNotes(`3 小時實體課建議配置：教學約 ${TEACH_MIN} 分鐘＋中場休息 10 分鐘（建議排在第 8 章之後）。各章分鐘數依簡報張數估算，可依學員背景調整；例如學員已熟悉 ISO 27001，可縮短第 6、7 章，把時間留給第 9～13 章附錄 A 控制措施與第 15 章稽核實務。線上教材與互動影音內容比簡報更完整，請學員課後補充。`);
}

// ---------- 3. 各章 ----------
const PHRASE = {
  allan: ["來，重點來了！", "稽核員一定會問這個", "各位記得喔", "現場最常看到的是…", "這裡要留證據"],
  arale: ["嗯嗯！這個要記起來～", "原來如此！", "哇～好重要！", "Allan 老師，我懂了！", "筆記筆記～"],
};
let k = 0;
for (const { c, m } of plan) {
  const sec = `${c.no}. ${c.short || c.title}`;
  pres.addSection({ title: sec });
  // 章節分隔頁
  const d = pres.addSlide({ masterName: "SECTION", sectionTitle: sec });
  d.addText(`CHAPTER ${String(c.no).padStart(2, "0")}`, { x: 0.8, y: 1.6, w: 5, h: 0.6, fontSize: 20, bold: true, color: HEX.accent3, isTextBox: true, margin: 0, charSpacing: 4 });
  d.addText(c.title, { placeholder: "title" });
  const sub = [(c.clauses || []).length ? `條款：${c.clauses.join("、")}` : "", `建議時間：約 ${m} 分鐘`].filter(Boolean).join("　｜　");
  d.addText(sub, { placeholder: "body" });
  portrait(d, k % 2 ? "arale" : "allan", 9.9, 0.9, 2.4, null);
  if (c.keypoints && c.keypoints[0]) bubble(d, c.keypoints[0], 8.9, 5.0, 4.0, 1.5, k % 2 ? "arale" : "allan");
  d.addNotes(`【第 ${c.no} 章 ${c.title}】\n學習目標：\n` + (c.objectives || []).map((o, i) => `${i + 1}. ${o}`).join("\n") + `\n\n本章重點：\n` + (c.keypoints || []).map((o) => `・${o}`).join("\n"));

  c.slides.forEach((sl, si) => {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: sec });
    s.addText(sl.title, { placeholder: "title" });
    const bl = (sl.bullets || []).slice(0, 7);
    const shortish = bl.length >= 3 && bl.length <= 6 && bl.every((b) => b.length <= 42);
    const who = k % 2 ? "arale" : "allan";
    k++;
    if (shortish && si % 2 === 1) {
      // 卡片格狀版面
      const cols = 2, rows = Math.ceil(bl.length / cols);
      const gw = 12.1, gh = 5.3, gap = 0.3;
      const cw = (gw - gap) / cols, chh = Math.min(1.6, (gh - gap * (rows - 1)) / rows);
      bl.forEach((b, i) => {
        const x = 0.6 + (i % cols) * (cw + gap), y = 1.5 + Math.floor(i / cols) * (chh + gap);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: chh, rectRadius: 0.12, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, objectName: `card-${i}` });
        s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + chh / 2 - 0.3, w: 0.6, h: 0.6, fill: { color: [HEX.accent1, HEX.accent4, HEX.accent2, HEX.accent3][i % 4] }, line: { color: HEX.lt1, width: 0 }, objectName: `num-${i}` });
        s.addText(String(i + 1), { x: x + 0.25, y: y + chh / 2 - 0.3, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: HEX.lt1, align: "center", valign: "middle", isTextBox: true, margin: 0 });
        s.addText(b, { x: x + 1.05, y: y + 0.1, w: cw - 1.25, h: chh - 0.2, fontSize: 19, color: C.text1, valign: "middle", isTextBox: true, margin: 0 });
      });
    } else {
      // 重點清單＋角色
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.45, w: 9.0, h: 5.35, rectRadius: 0.12, fill: { color: HEX.lt2 }, line: { color: HEX.lt2 }, objectName: "bullets-card" });
      s.addText(bl.map((b, i) => ({ text: b, options: { bullet: { indent: 18 }, breakLine: i < bl.length - 1 } })), {
        x: 0.9, y: 1.65, w: 8.4, h: 4.95, fontSize: bl.length > 5 ? 22 : 24, color: C.text1, valign: "middle", paraSpaceAfter: 16, isTextBox: true, margin: 0,
      });
      const ph = portrait(s, who, 10.45, 1.45, 1.95, who === "allan" ? "Allan 講師" : "阿拉蕾");
      bubble(s, PHRASE[who][si % PHRASE[who].length], 10.0, 1.45 + ph + 0.55, 2.85, 0.7, who);
    }
    s.addNotes(sl.notes || "");
  });
}

// ---------- 4. 結尾 ----------
pres.addSection({ title: "結語" });
{
  const s = pres.addSlide({ masterName: "DARK_TITLE", sectionTitle: "結語" });
  s.addText("課後學習與測驗", { x: 0.8, y: 1.2, w: 7.6, h: 0.9, fontSize: 36, bold: true, color: HEX.lt1, isTextBox: true, margin: 0 });
  s.addText([
    { text: "線上文字教材：比簡報更完整的條文解說、範本與稽核案例", options: { bullet: true, breakLine: true } },
    { text: "互動影音：Allan × 阿拉蕾對話教學，可選章節、跳場景", options: { bullet: true, breakLine: true } },
    { text: "課後測驗：10 題、80 分及格，可下載結業證書（附題目與解答）", options: { bullet: true, breakLine: true } },
    { text: "未及格：重新閱讀相關章節後再測一次", options: { bullet: true } },
  ], { x: 0.8, y: 2.3, w: 7.6, h: 3.0, fontSize: 18, color: "CADCFC", paraSpaceAfter: 12, isTextBox: true, margin: 0 });
  s.addText("Q & A｜謝謝大家！", { x: 0.8, y: 5.6, w: 7.6, h: 0.8, fontSize: 28, bold: true, color: HEX.accent3, isTextBox: true, margin: 0 });
  portrait(s, "arale", 8.55, 3.0, 1.9, "助教 阿拉蕾");
  portrait(s, "allan", 10.75, 1.1, 2.0, "Allan 講師");
  s.addNotes("總結：請學員回想三大面向（標準解說、PIMS 管理作法、稽核實務），開放 Q&A。提醒學員到線上課程網站完成課後測驗並下載證書。若學員公司正在導入，建議先從個資盤點（RoPA）與角色判定開始。");
}

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  if (SKILL_THEME) {
    const { applyTheme } = require(SKILL_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log("written", OUT, "teaching minutes", acc);
})();

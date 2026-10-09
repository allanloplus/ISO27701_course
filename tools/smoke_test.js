// 網站煙霧測試：node tools/smoke_test.js <輸出截圖資料夾>
// 以 file:// 開啟各頁，檢查 JS 錯誤並截圖；並模擬一次及格測驗、產生證書。
const path = require("path");
const { chromium } = require("playwright");
const SITE = "file://" + path.resolve(__dirname, "..", "site") + "/";
const OUT = process.argv[2] || ".";

(async () => {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(SITE + "index.html"); await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/index.png`, fullPage: false });

  await page.goto(SITE + "text.html#ch05"); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/text.png` });

  await page.goto(SITE + "video.html#ch02"); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/video0.png` });
  await page.click("#bigPlay"); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/video1.png` });
  const t0 = await page.textContent("#pos");
  await page.click("#bNextS"); await page.waitForTimeout(1500);
  const t1 = await page.textContent("#pos");
  console.log("video pos", t0, "->", t1);

  // 測驗：先全錯，再全對
  await page.goto(SITE + "quiz.html"); await page.waitForTimeout(500);
  const Q = await page.evaluate(() => window.QUIZ.questions.map((q) => q.answer));
  for (let i = 0; i < Q.length; i++) await page.check(`input[name=q${i}][value="${(Q[i] + 1) % 4}"]`);
  await page.click("button[type=submit]"); await page.waitForTimeout(400);
  console.log("fail text:", (await page.textContent("#result")).slice(0, 40));
  await page.screenshot({ path: `${OUT}/quiz_fail.png` });
  await page.click("#retry"); await page.waitForTimeout(300);
  for (let i = 0; i < Q.length; i++) await page.check(`input[name=q${i}][value="${Q[i]}"]`);
  await page.click("button[type=submit]"); await page.waitForTimeout(400);
  await page.fill("#f-company", "範例科技股份有限公司");
  await page.fill("#f-unit", "資訊安全部");
  await page.fill("#f-name", "王小明");
  await page.fill("#f-title", "資安經理");
  await page.fill("#f-email", "test@example.com");
  await page.click("#mkCert"); await page.waitForTimeout(1200);
  const cert = await page.evaluate(() => document.getElementById("cv").toDataURL());
  const ans = await page.evaluate(() => document.getElementById("cv2").toDataURL());
  require("fs").writeFileSync(`${OUT}/cert.png`, Buffer.from(cert.split(",")[1], "base64"));
  require("fs").writeFileSync(`${OUT}/answers.png`, Buffer.from(ans.split(",")[1], "base64"));

  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  m.on("pageerror", (e) => errors.push("mobile: " + e.message));
  await m.goto(SITE + "video.html#ch01"); await m.waitForTimeout(800);
  await m.click("#bigPlay"); await m.waitForTimeout(1500);
  await m.screenshot({ path: `${OUT}/video_mobile.png` });
  await m.goto(SITE + "text.html#ch09"); await m.waitForTimeout(800);
  await m.screenshot({ path: `${OUT}/text_mobile.png` });

  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no JS errors");
  await browser.close();
})();

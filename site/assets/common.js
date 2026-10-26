// 共用：載入章節資料、頂部導覽列、localStorage 安全存取
(function () {
  const store = {
    get(k, d) { try { const v = localStorage.getItem("iso27701:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("iso27701:" + k, JSON.stringify(v)); } catch (e) {} },
  };

  function loadChapter(id) {
    window.__CH = window.__CH || {};
    if (window.__CH[id]) return Promise.resolve(window.__CH[id]);
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "data/" + id + ".js";
      s.onload = () => (window.__CH[id] ? res(window.__CH[id]) : rej(new Error("no data")));
      s.onerror = () => rej(new Error("load failed"));
      document.head.appendChild(s);
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // 簡易行內格式：**粗體**
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>"); }

  // 授權資訊（公開版 COURSE_LICENSE = null，不顯示任何授權資訊）
  const LIC = (window.COURSE_LICENSE && window.COURSE_LICENSE.company) ? window.COURSE_LICENSE : null;
  function licenseText() {
    if (!LIC) return "";
    const who = LIC.company + (LIC.dept ? " " + LIC.dept : "");
    const period = LIC.start || LIC.end ? `，授權期間 ${LIC.start || ""}${LIC.end ? " ～ " + LIC.end : " 起"}` : "";
    return `本教材經授權供「${who}」${LIC.note || "內部教育訓練使用"}${LIC.no ? `（授權編號 ${LIC.no}${period}）` : (period ? `（${period.slice(1)}）` : "")}。未經授權，請勿轉載、複製或對外公開。`;
  }
  function licenseWarnings() {
    if (!LIC) return [];
    const w = [], today = new Date().toISOString().slice(0, 10), host = location.hostname;
    if (LIC.end && today > LIC.end) w.push(`本教材授權已於 ${LIC.end} 到期，請洽 Allan Lo顧問（www.123hi.org）續約。`);
    if (LIC.domains && LIC.domains.length && host && !/^(localhost|127\.|\[::1\])/.test(host) &&
        !LIC.domains.some((d) => host === d || host.endsWith("." + d)))
      w.push(`此網站（${host}）不在授權網域內，請洽 Allan Lo顧問（www.123hi.org）。`);
    return w;
  }

  function topbar(active) {
    const links = [
      ["index.html", "課程首頁", "home"],
      ["text.html", "文字教材", "text"],
      ["video.html", "互動影音", "video"],
      ["quiz.html", "課後測驗", "quiz"],
    ];
    const el = document.createElement("header");
    el.className = "topbar";
    el.innerHTML = '<a class="logo" href="index.html"><b>ISO/IEC 27701</b>:2025 PIMS 線上課程</a><nav>' +
      links.map(([h, t, k]) => `<a href="${h}" class="${k === active ? "on" : ""}">${t}</a>`).join("") + "</nav>";
    if (LIC) {
      const b = document.createElement("span");
      b.className = "lic-badge"; b.title = licenseText(); b.textContent = "授權：" + LIC.company;
      el.querySelector(".logo").after(b);
    }
    document.body.prepend(el);
    if (LIC) {
      const warns = licenseWarnings();
      if (warns.length) {
        const w = document.createElement("div"); w.className = "lic-warn"; w.textContent = warns.join(" ");
        document.body.prepend(w);
      }
      document.querySelectorAll("[data-lic-company]").forEach((n) => { n.textContent = LIC.company + "　內部教育訓練專用"; n.hidden = false; });
    }
    footer();
  }

  // 版權與製作資訊（所有頁面共用）
  function footer() {
    const f = document.createElement("footer");
    f.className = "foot credit";
    f.innerHTML = (LIC ? `<div class="lic-line">${esc(licenseText())}</div>` : "") + '教材規劃製作：Allan Lo顧問（<a href="http://www.123hi.org" target="_blank" rel="noopener">http://www.123hi.org</a>）｜2026年10月<br>Copyright © 2026 Allan Lo. All rights reserved.';
    document.body.appendChild(f);
  }

  window.Course = { store, loadChapter, esc, fmt, topbar, license: LIC, licenseText };
})();

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
    document.body.prepend(el);
  }

  window.Course = { store, loadChapter, esc, fmt, topbar };
})();

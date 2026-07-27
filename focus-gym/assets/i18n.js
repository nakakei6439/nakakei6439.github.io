/* FocusGym 公開ページ用の軽量 i18n ランタイム。
 * 各ページは末尾で FGI18N.init(DICT) を呼ぶ。DICT は { <lang>: { key: text, ... } }。
 * テキストは data-i18n（textContent）／data-i18n-html（innerHTML: リンク等の markup 用）で差し込む。
 * 言語は ?lang= → localStorage → navigator の順で判定し、右上のセレクトで切替できる。 */
(function () {
  var SUPPORTED = ["ja", "en", "de", "es", "fr", "ko", "zh-Hans", "zh-Hant"];
  var NAMES = {
    ja: "日本語", en: "English", de: "Deutsch", es: "Español",
    fr: "Français", ko: "한국어", "zh-Hans": "简体中文", "zh-Hant": "繁體中文"
  };

  function detect() {
    try {
      var url = new URLSearchParams(location.search).get("lang");
      if (url && SUPPORTED.indexOf(url) !== -1) return url;
      var saved = localStorage.getItem("fg_lang");
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* ignore */ }
    var langs = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < langs.length; i++) {
      var l = (langs[i] || "").toLowerCase();
      if (l.indexOf("ja") === 0) return "ja";
      if (l.indexOf("ko") === 0) return "ko";
      if (l.indexOf("de") === 0) return "de";
      if (l.indexOf("es") === 0) return "es";
      if (l.indexOf("fr") === 0) return "fr";
      if (l.indexOf("zh") === 0) {
        if (l.indexOf("hant") !== -1 || l.indexOf("tw") !== -1 ||
            l.indexOf("hk") !== -1 || l.indexOf("mo") !== -1) return "zh-Hant";
        return "zh-Hans";
      }
      if (l.indexOf("en") === 0) return "en";
    }
    return "en";
  }

  function apply(dict, lang) {
    var d = dict[lang] || dict.en || dict.ja;
    if (!d) return;
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute("data-i18n");
      if (d[k] != null) nodes[i].textContent = d[k];
    }
    var html = document.querySelectorAll("[data-i18n-html]");
    for (var j = 0; j < html.length; j++) {
      var hk = html[j].getAttribute("data-i18n-html");
      if (d[hk] != null) html[j].innerHTML = d[hk];
    }
    if (d.__title__) document.title = d.__title__;
    var meta = document.querySelector('meta[name="description"]');
    if (meta && d.__desc__) meta.setAttribute("content", d.__desc__);
  }

  function injectStyle() {
    if (document.getElementById("fg-i18n-style")) return;
    var s = document.createElement("style");
    s.id = "fg-i18n-style";
    s.textContent =
      "#fg-lang-switch{position:fixed;top:12px;right:12px;z-index:9999;" +
      "font:600 0.85rem/1 -apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;" +
      "color:#2f5f48;background:rgba(255,255,255,0.92);border:1px solid rgba(0,0,0,0.12);" +
      "border-radius:999px;padding:0.4rem 1.8rem 0.4rem 0.8rem;box-shadow:0 2px 8px rgba(0,0,0,0.12);" +
      "-webkit-appearance:none;appearance:none;cursor:pointer;" +
      "background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235C9E7A'/%3E%3C/svg%3E\");" +
      "background-repeat:no-repeat;background-position:right 0.7rem center;}";
    document.head.appendChild(s);
  }

  function buildSwitch(dict, lang, onchange) {
    if (document.getElementById("fg-lang-switch")) return;
    var sel = document.createElement("select");
    sel.id = "fg-lang-switch";
    sel.setAttribute("aria-label", "Language / 言語");
    for (var i = 0; i < SUPPORTED.length; i++) {
      var o = document.createElement("option");
      o.value = SUPPORTED[i];
      o.textContent = NAMES[SUPPORTED[i]];
      if (SUPPORTED[i] === lang) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener("change", function () { onchange(sel.value); });
    document.body.appendChild(sel);
  }

  window.FGI18N = {
    init: function (dict) {
      var lang = detect();
      function mount() {
        injectStyle();
        apply(dict, lang);
        buildSwitch(dict, lang, function (next) {
          lang = next;
          try { localStorage.setItem("fg_lang", next); } catch (e) { /* ignore */ }
          apply(dict, next);
        });
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
      } else {
        mount();
      }
    }
  };
})();

/* 全アプリ紹介ページ共通の軽量 i18n ランタイム。
 * 各ページは末尾で FGI18N.init(DICT) を呼ぶ。DICT は { <lang>: { key: text, ... } }。
 *
 * 差し込み先は属性で指定する:
 *   data-i18n       … textContent
 *   data-i18n-html  … innerHTML（リンク等の markup 用）
 *   data-i18n-alt   … img の alt
 *   data-i18n-label … aria-label
 *   data-i18n-src   … img の src。値はパスそのもので、含まれる {lang} が現在の言語に置き換わる
 *                     例: <img data-i18n-src="assets/screenshots/{lang}/01.png">
 *
 * 言語は ?lang= → localStorage("site-lang") → navigator の順で判定し、右上のセレクトで切替できる。
 * ?lang= で来た場合はその言語を保存する。旧キー fg_lang / ct_lang は初回に site-lang へ移行する。 */
(function () {
  var SUPPORTED = ["ja", "en", "de", "es", "fr", "ko", "zh-Hans", "zh-Hant"];
  var NAMES = {
    ja: "日本語", en: "English", de: "Deutsch", es: "Español",
    fr: "Français", ko: "한국어", "zh-Hans": "简体中文", "zh-Hant": "繁體中文"
  };
  var KEY = "site-lang";
  var LEGACY_KEYS = ["fg_lang", "ct_lang"];

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v && SUPPORTED.indexOf(v) !== -1) return v;
      // 旧キーからの移行。見つかったら site-lang に書き直して旧キーは捨てる。
      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        var old = localStorage.getItem(LEGACY_KEYS[i]);
        localStorage.removeItem(LEGACY_KEYS[i]);
        if (!v && old && SUPPORTED.indexOf(old) !== -1) v = old;
      }
      if (v) localStorage.setItem(KEY, v);
      return v;
    } catch (e) { return null; }
  }

  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
  }

  function fromNavigator() {
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

  function detect() {
    try {
      var url = new URLSearchParams(location.search).get("lang");
      if (url && SUPPORTED.indexOf(url) !== -1) {
        // SNS から ?lang=en 付きで来た人が次回も同じ言語で開けるように保存する。
        save(url);
        return url;
      }
    } catch (e) { /* ignore */ }
    return read() || fromNavigator();
  }

  function fill(sel, attr, apply) {
    var nodes = document.querySelectorAll("[" + attr + "]");
    for (var i = 0; i < nodes.length; i++) apply(nodes[i], nodes[i].getAttribute(attr));
  }

  /* キーを引く。"a.b.c" のようにドットを含む場合は入れ子をたどる。
   * 平坦なキーにドットは現れないので、既存ページの挙動は変わらない。 */
  function lookup(dict, key) {
    if (key == null) return undefined;
    if (dict[key] !== undefined) return dict[key];
    if (key.indexOf(".") === -1) return undefined;
    return key.split(".").reduce(function (acc, k) {
      return acc && acc[k] !== undefined ? acc[k] : undefined;
    }, dict);
  }

  function apply(dict, lang) {
    var d = dict[lang] || dict.en || dict.ja;
    if (!d) return;
    document.documentElement.lang = lang;

    fill(null, "data-i18n", function (el, k) {
      var v = lookup(d, k);
      if (v != null) el.textContent = v;
    });
    fill(null, "data-i18n-html", function (el, k) {
      var v = lookup(d, k);
      if (v != null) el.innerHTML = v;
    });
    fill(null, "data-i18n-alt", function (el, k) {
      var v = lookup(d, k);
      if (v != null) el.setAttribute("alt", v);
    });
    fill(null, "data-i18n-label", function (el, k) {
      var v = lookup(d, k);
      if (v != null) el.setAttribute("aria-label", v);
    });
    // src はテンプレート。辞書ではなくパス中の {lang} を置換する。
    fill(null, "data-i18n-src", function (el, tpl) {
      if (!tpl) return;
      var next = tpl.replace(/\{lang\}/g, lang);
      if (el.getAttribute("src") !== next) el.setAttribute("src", next);
    });

    var title = lookup(d, "__title__") || lookup(d, "pageTitle") || lookup(d, "meta.title");
    if (title) document.title = title;
    var meta = document.querySelector('meta[name="description"]');
    var desc = lookup(d, "__desc__");
    if (meta && desc) meta.setAttribute("content", desc);
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

  /* ページが自前の切替UIを持つ場合は data-i18n-switcher を付けておく。
   * その <select> に接続し、部品側からは何も注入しない（配色が合わないUIが重なるのを避ける）。 */
  function bindExisting(lang, onchange) {
    var sel = document.querySelector("select[data-i18n-switcher]");
    if (!sel) return false;
    sel.value = lang;
    sel.addEventListener("change", function () { onchange(sel.value); });
    return true;
  }

  function buildSwitch(dict, lang, onchange) {
    if (bindExisting(lang, onchange)) return;
    if (document.getElementById("fg-lang-switch")) return;
    injectStyle();
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
    supported: SUPPORTED,
    init: function (dict) {
      var lang = detect();
      function mount() {
        apply(dict, lang);
        buildSwitch(dict, lang, function (next) {
          lang = next;
          save(next);
          apply(dict, next);
        });
        // 切替前のチラつきを body の非表示で抑えているページ向けの合図。
        // （html:not(.i18n-ready) body{opacity:0} を置いているページだけが影響を受ける）
        document.documentElement.classList.add("i18n-ready");
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
      } else {
        mount();
      }
    }
  };
})();

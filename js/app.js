/* STYVEN ABOUT - JavaScript vanilla (ES5, sans dépendance) */
(function () {
  "use strict";

  var APP_VERSION = "1.0.0";
  var PAGES = ["home", "console", "storage", "network", "diagnostic", "about"];
  var TITLES = { home: "Accueil", console: "Console", storage: "Stockage", network: "Réseau", diagnostic: "Diagnostic", about: "À propos" };
  var current = "home";

  /* ---------- Utilitaires ---------- */
  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function hasClass(el, c) { return (" " + el.className + " ").indexOf(" " + c + " ") !== -1; }
  function addClass(el, c) { if (!hasClass(el, c)) { el.className = (el.className + " " + c).replace(/^\s+/, ""); } }
  function removeClass(el, c) { el.className = (" " + el.className + " ").replace(" " + c + " ", " ").replace(/^\s+|\s+$/g, ""); }
  function setClass(el, c, on) { if (on) { addClass(el, c); } else { removeClass(el, c); } }
  function narrow() { return (window.innerWidth || document.documentElement.clientWidth) <= 820; }

  var STATE_LABEL = { ok: "Disponible", ko: "Indisponible", unsupported: "Non pris en charge" };
  var STATE_CLASS = { ok: "ok", ko: "ko", unsupported: "na" };

  function rowsHtml(items) {
    var html = "", i, it;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      html += '<div class="row"><span class="k">' + esc(it.k) + '</span><span class="v ' + (it.s || "") + '">' + esc(it.v) + "</span></div>";
    }
    return html;
  }
  function stateRow(name, state, detail) {
    return { k: name, v: STATE_LABEL[state] + (detail ? " (" + detail + ")" : ""), s: STATE_CLASS[state] };
  }

  /* ---------- Tests de fonctionnalités (partagés Console / Diagnostic) ---------- */
  function cssSupport(props) {
    var s = document.createElement("div").style, i;
    for (i = 0; i < props.length; i++) { if (props[i] in s) { return true; } }
    return false;
  }
  var FEATURES = [
    { name: "Stockage local (localStorage)", test: function () {
      try { if (!window.localStorage) { return "unsupported"; } localStorage.setItem("__sa", "1"); localStorage.removeItem("__sa"); return "ok"; }
      catch (e) { return "ko"; } } },
    { name: "Requêtes XMLHttpRequest", test: function () { return window.XMLHttpRequest ? "ok" : "unsupported"; } },
    { name: "JSON", test: function () { return window.JSON && JSON.parse ? "ok" : "unsupported"; } },
    { name: "Animation (requestAnimationFrame)", test: function () {
      return (window.requestAnimationFrame || window.webkitRequestAnimationFrame) ? "ok" : "unsupported"; } },
    { name: "Événement hashchange", test: function () { return "onhashchange" in window ? "ok" : "unsupported"; } },
    { name: "CSS flexbox", test: function () { return cssSupport(["flex", "webkitFlex"]) ? "ok" : "unsupported"; } },
    { name: "CSS transitions", test: function () { return cssSupport(["transition", "webkitTransition"]) ? "ok" : "unsupported"; } },
    { name: "Canvas 2D", test: function () {
      try { var c = document.createElement("canvas"); return (c.getContext && c.getContext("2d")) ? "ok" : "unsupported"; }
      catch (e) { return "ko"; } } },
    { name: "WebGL", test: function () {
      try { var c = document.createElement("canvas");
        return (c.getContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))) ? "ok" : "unsupported"; }
      catch (e) { return "ko"; } } },
    { name: "Audio HTML5", test: function () { return window.Audio ? "ok" : "unsupported"; } },
    { name: "Internationalisation (Intl)", test: function () { return window.Intl ? "ok" : "unsupported"; } },
    { name: "API Gamepad (manette)", test: function () {
      return (navigator.getGamepads || navigator.webkitGetGamepads) ? "ok" : "unsupported"; } }
  ];

  /* ---------- Routeur ---------- */
  function hashName() {
    var h = (window.location.hash || "").replace("#", "");
    return PAGES.indexOf(h) !== -1 ? h : "home";
  }
  function showPage(name) {
    if (PAGES.indexOf(name) === -1) { name = "home"; }
    current = name;
    qsa(".page").forEach(function (p) { setClass(p, "active", p.id === "page-" + name); });
    qsa(".nav-item").forEach(function (b) { setClass(b, "active", b.getAttribute("data-page") === name); });
    document.title = "STYVEN ABOUT - " + TITLES[name];
    $("main").scrollTop = 0;
    if (hashName() !== name) { window.location.hash = name; }
    if (name === "console") { renderConsole(); }
    if (name === "network") { renderNetwork(); }
    if (name === "diagnostic") { runDiagnostic(); }
    if (name === "storage") { calcStorage(); }
  }
  function switchBy(delta) {
    var i = PAGES.indexOf(current) + delta;
    if (i < 0) { i = PAGES.length - 1; }
    if (i >= PAGES.length) { i = 0; }
    showPage(PAGES[i]);
  }

  /* ---------- Accueil ---------- */
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function updateClock() {
    var d = new Date(), el = $("clockVal");
    if (!el || isNaN(d.getTime())) { return; }
    el.textContent = DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() +
      ", " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
  }
  function initHome() {
    var st = $("homeState"), host = $("hostVal");
    st.textContent = "Opérationnel, JavaScript actif"; st.className = "v ok";
    host.textContent = window.location.protocol === "file:" ? "Ouvert en local (fichier), non publié" : window.location.host;
    qsa(".ver").forEach(function (el) { el.textContent = APP_VERSION; });
    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ---------- Console ---------- */
  function detectBrowser() {
    var ua = navigator.userAgent || "", m;
    if ((m = /PlayStation\s*(\d+)/.exec(ua))) {
      var fw = /PlayStation\s*\d+\s*([\d.]+)/.exec(ua);
      return "Navigateur PlayStation " + m[1] + (fw ? " (user-agent : " + fw[1] + ", à vérifier)" : "");
    }
    if ((m = /Edg(?:e|A|iOS)?\/([\d.]+)/.exec(ua))) { return "Microsoft Edge " + m[1]; }
    if ((m = /OPR\/([\d.]+)/.exec(ua))) { return "Opera " + m[1]; }
    if ((m = /Firefox\/([\d.]+)/.exec(ua))) { return "Firefox " + m[1]; }
    if ((m = /Chrome\/([\d.]+)/.exec(ua))) { return "Chrome ou dérivé " + m[1]; }
    if ((m = /Version\/([\d.]+).*Safari/.exec(ua))) { return "Safari " + m[1]; }
    if ((m = /(?:MSIE |rv:)([\d.]+)/.exec(ua)) && /Trident/.test(ua)) { return "Internet Explorer " + m[1]; }
    return null;
  }
  function val(v, suffix) {
    return (v === undefined || v === null || v === "") ? { v: "Non accessible", s: "na" } : { v: v + (suffix || ""), s: "ok" };
  }
  function renderConsole() {
    var b = detectBrowser(), tz = null, r = [], x;
    try { tz = window.Intl && Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = null; }
    var touch = (navigator.maxTouchPoints > 0) || ("ontouchstart" in window);
    var w = window.innerWidth || document.documentElement.clientWidth, h = window.innerHeight || document.documentElement.clientHeight;
    x = b ? { v: b, s: "ok" } : { v: "Non détecté", s: "na" }; r.push({ k: "Navigateur", v: x.v, s: x.s });
    x = val(navigator.userAgent); r.push({ k: "User-agent", v: x.v, s: x.s });
    x = val(navigator.platform); r.push({ k: "Plateforme déclarée", v: x.v, s: x.s });
    x = val(navigator.language || navigator.userLanguage); r.push({ k: "Langue", v: x.v, s: x.s });
    x = val(tz); r.push({ k: "Fuseau horaire", v: x.v, s: x.s });
    x = val(window.screen && screen.width ? screen.width + " × " + screen.height + " px" : null); r.push({ k: "Résolution de l’écran", v: x.v, s: x.s });
    r.push({ k: "Taille de la fenêtre", v: w + " × " + h + " px", s: "ok" });
    x = val(window.devicePixelRatio); r.push({ k: "Ratio de pixels", v: x.v, s: x.s });
    x = val(window.screen && screen.colorDepth, " bits"); r.push({ k: "Profondeur de couleur", v: x.v, s: x.s });
    r.push({ k: "Écran tactile", v: touch ? "Oui" : "Non détecté", s: touch ? "ok" : "na" });
    x = val(navigator.hardwareConcurrency, " cœurs logiques"); r.push({ k: "Processeur", v: x.v, s: x.s });
    x = val(navigator.deviceMemory, " Go (approximation)"); r.push({ k: "Mémoire vive", v: x.v, s: x.s });
    r.push({ k: "Cookies", v: navigator.cookieEnabled ? "Activés" : "Désactivés ou non détectés", s: navigator.cookieEnabled ? "ok" : "na" });
    $("consoleRows").innerHTML = rowsHtml(r);

    var caps = [], i, st;
    for (i = 0; i < FEATURES.length; i++) {
      try { st = FEATURES[i].test(); } catch (e2) { st = "ko"; }
      caps.push(stateRow(FEATURES[i].name, st));
    }
    $("consoleCaps").innerHTML = rowsHtml(caps);
  }

  /* ---------- Stockage ---------- */
  var units = { cap: "GB", used: "GB", game: "GB" };
  function parseNum(s) {
    s = String(s).replace(",", ".").replace(/\s/g, "");
    if (s === "") { return null; }
    var n = Number(s);
    return (isFinite(n) && n >= 0) ? n : NaN;
  }
  function toGB(v, unit) { return unit === "TB" ? v * 1000 : v; }
  function fmtNum(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }
  function fmtGB(gb) { return gb >= 1000 ? fmtNum(gb / 1000) + " To" : fmtNum(gb) + " Go"; }
  function setUnit(target, unit) {
    units[target] = unit;
    $(target + "Unit").textContent = unit === "TB" ? "To" : "Go";
  }
  function stShow(type, text, pct, rows) {
    var m = $("stMsg"), bar = $("stBar");
    m.className = "msg " + type; m.textContent = text;
    bar.style.width = pct + "%";
    bar.className = pct >= 90 ? "crit" : (pct >= 75 ? "warn" : "");
    $("stBarBox").setAttribute("aria-valuenow", String(Math.round(pct)));
    $("stRows").innerHTML = rows ? rowsHtml(rows) : "";
  }
  function calcStorage() {
    var capV = parseNum($("capVal").value), usedV = parseNum($("usedVal").value), gameV = parseNum($("gameVal").value);
    if (isNaN(capV) || isNaN(usedV) || isNaN(gameV)) {
      stShow("err", "Valeur invalide. Utilise uniquement des chiffres, par exemple 500 ou 1,5.", 0); return;
    }
    if (capV === null || capV === 0) { stShow("", "Saisis une capacité pour lancer le calcul.", 0); return; }
    var cap = toGB(capV, units.cap), used = toGB(usedV || 0, units.used), game = gameV ? toGB(gameV, units.game) : 0;
    if (used > cap) { stShow("err", "L’espace utilisé dépasse la capacité totale.", 100); return; }
    var free = cap - used, pct = used / cap * 100;
    var rows = [
      { k: "Capacité totale", v: fmtGB(cap) },
      { k: "Espace utilisé", v: fmtGB(used) },
      { k: "Espace libre", v: fmtGB(free), s: "ok" },
      { k: "Taux d’utilisation", v: fmtNum(pct) + " %" }
    ];
    var msg = "Calcul effectué sur les valeurs saisies.", type = "";
    if (game > 0) {
      if (game <= free) { rows.push({ k: "Libre après installation", v: fmtGB(free - game), s: "ok" }); msg = "Le jeu rentre dans l’espace libre."; type = "good"; }
      else { rows.push({ k: "Espace manquant", v: fmtGB(game - free), s: "ko" }); msg = "Le jeu ne rentre pas dans l’espace libre."; type = "err"; }
    }
    stShow(type, msg, pct, rows);
  }
  function stepUsed(delta) {
    var u = parseNum($("usedVal").value);
    if (isNaN(u)) { u = 0; }
    var gb = toGB(u || 0, units.used) + delta;
    if (gb < 0) { gb = 0; }
    $("usedVal").value = units.used === "TB" ? String(Math.round(gb / 10) / 100) : String(Math.round(gb * 100) / 100);
    calcStorage();
  }

  /* ---------- Réseau ---------- */
  function renderNetwork() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection, r = [];
    if (typeof navigator.onLine === "boolean") { r.push({ k: "Navigateur en ligne", v: navigator.onLine ? "Oui (selon le navigateur)" : "Non", s: navigator.onLine ? "ok" : "ko" }); }
    else { r.push({ k: "Navigateur en ligne", v: "Non accessible", s: "na" }); }
    if (c) {
      r.push({ k: "Type de connexion estimé", v: c.effectiveType || "Non accessible", s: c.effectiveType ? "ok" : "na" });
      r.push({ k: "Débit descendant estimé", v: c.downlink ? c.downlink + " Mb/s (estimation, pas une mesure)" : "Non accessible", s: c.downlink ? "ok" : "na" });
      r.push({ k: "Latence estimée", v: c.rtt ? c.rtt + " ms (estimation)" : "Non accessible", s: c.rtt ? "ok" : "na" });
    } else {
      r.push({ k: "API Network Information", v: "Non prise en charge par ce navigateur", s: "na" });
    }
    $("netRows").innerHTML = rowsHtml(r);
  }
  var netBusy = false;
  function testConnection() {
    var out = $("netResult");
    if (netBusy) { return; }
    if (!window.XMLHttpRequest) { out.className = "msg err"; out.textContent = "Test impossible : XMLHttpRequest non pris en charge."; return; }
    netBusy = true; out.className = "msg"; out.textContent = "Test en cours…";
    var t0 = new Date().getTime(), xhr = new XMLHttpRequest(), done = false;
    function finish(cls, text) { if (done) { return; } done = true; netBusy = false; out.className = "msg " + cls; out.textContent = text; }
    try {
      xhr.open("GET", "index.html?t=" + t0, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) { return; }
        var ms = new Date().getTime() - t0;
        if (xhr.status >= 200 && xhr.status < 300) { finish("good", "Site joignable. Réponse en " + ms + " ms (HTTP " + xhr.status + ")."); }
        else if (xhr.status === 0 && window.location.protocol === "file:") { finish("err", "Test impossible : la page est ouverte en local. Publie-la sur GitHub Pages pour tester."); }
        else if (xhr.status === 0) { finish("err", "Aucune réponse. Le site est injoignable ou la connexion est coupée."); }
        else { finish("err", "Le serveur a répondu avec une erreur (HTTP " + xhr.status + ")."); }
      };
      xhr.timeout = 8000;
      xhr.ontimeout = function () { finish("err", "Délai dépassé après 8 secondes : connexion trop lente ou coupée."); };
      xhr.send(null);
    } catch (e) { finish("err", "Le test a échoué : " + e.message); }
  }

  /* ---------- Diagnostic ---------- */
  function runDiagnostic() {
    var res = [], i, st, nbOk = 0, nbKo = 0, nbUn = 0;
    var sw = window.screen ? screen.width : 0, sh = window.screen ? screen.height : 0;
    var w = window.innerWidth || document.documentElement.clientWidth;
    res.push(stateRow("JavaScript", "ok", "ce script s’exécute"));
    res.push(stateRow("Résolution 1920 × 1080 ou plus", (sw >= 1920 && sh >= 1080) ? "ok" : "ko", sw && sh ? "écran : " + sw + " × " + sh : "écran non mesurable"));
    res.push(stateRow("Fenêtre mesurable", w > 0 ? "ok" : "ko", w + " px de large"));
    var navOk = true;
    for (i = 0; i < PAGES.length; i++) { if (!$("page-" + PAGES[i]) || !document.querySelector('[data-page="' + PAGES[i] + '"]')) { navOk = false; } }
    res.push(stateRow("Navigation entre les pages", navOk ? "ok" : "ko", PAGES.length + " pages"));
    for (i = 0; i < FEATURES.length; i++) {
      try { st = FEATURES[i].test(); } catch (e) { st = "ko"; }
      res.push(stateRow(FEATURES[i].name, st));
    }
    for (i = 0; i < res.length; i++) {
      if (res[i].s === "ok") { nbOk++; } else if (res[i].s === "ko") { nbKo++; } else { nbUn++; }
    }
    $("diagRows").innerHTML = rowsHtml(res);
    $("diagSummary").textContent = nbOk + " disponible(s), " + nbKo + " indisponible(s), " + nbUn + " non pris en charge.";
  }

  /* ---------- Test des commandes (clavier et manette) ---------- */
  var seenInputs = {};
  function flash(name) {
    var els = qsa('[data-input="' + name + '"]');
    if (!els.length) { return; }
    seenInputs[name] = true;
    els.forEach(function (el) {
      addClass(el, "seen"); addClass(el, "hit");
      setTimeout(function () { removeClass(el, "hit"); }, 250);
    });
    var n = 0, k; for (k in seenInputs) { if (seenInputs.hasOwnProperty(k)) { n++; } }
    $("keysMsg").textContent = n >= 6 ? "Toutes les commandes ont été détectées." : n + " commande(s) détectée(s) sur 6.";
  }

  /* ---------- Navigation spatiale (clavier et manette) ---------- */
  function visible(el) { return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled; }
  function zoneOf(el) {
    while (el) { if (el.id === "nav") { return "nav"; } if (el.id === "main") { return "main"; } el = el.parentNode; }
    return null;
  }
  function focusables(zone) {
    return qsa(zone === "nav" ? "#nav .focusable" : "#main .page.active .focusable").filter(visible);
  }
  function ensureVisible(el) {
    if (zoneOf(el) !== "main") { return; }
    var m = $("main"), r = el.getBoundingClientRect(), mr = m.getBoundingClientRect();
    if (r.top < mr.top + 20) { m.scrollTop -= (mr.top + 20 - r.top); }
    else if (r.bottom > mr.bottom - 20) { m.scrollTop += (r.bottom - (mr.bottom - 20)); }
  }
  function focusEl(el) { if (el) { el.focus(); ensureVisible(el); } }
  function activeNavItem() { return document.querySelector("#nav .nav-item.active"); }
  function focusFirstMain() { var l = focusables("main"); focusEl(l.length ? l[0] : activeNavItem()); }
  function move(dir) {
    var cur = document.activeElement, zone = zoneOf(cur);
    if (!zone) { focusEl(activeNavItem()); return; }
    var list = focusables(zone), best = null, bestScore = 1e9, cr = cur.getBoundingClientRect();
    var cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2, i, r, dx, dy, prim, perp, score;
    for (i = 0; i < list.length; i++) {
      if (list[i] === cur) { continue; }
      r = list[i].getBoundingClientRect();
      dx = r.left + r.width / 2 - cx; dy = r.top + r.height / 2 - cy;
      if (dir === "up" && dy < -2) { prim = -dy; perp = Math.abs(dx); }
      else if (dir === "down" && dy > 2) { prim = dy; perp = Math.abs(dx); }
      else if (dir === "left" && dx < -2) { prim = -dx; perp = Math.abs(dy); }
      else if (dir === "right" && dx > 2) { prim = dx; perp = Math.abs(dy); }
      else { continue; }
      score = prim + perp * 2.5;
      if (score < bestScore) { bestScore = score; best = list[i]; }
    }
    if (best) { focusEl(best); return; }
    var toMain = narrow() ? "down" : "right", toNav = narrow() ? "up" : "left";
    if (zone === "main" && dir === toNav) { focusEl(activeNavItem()); }
    else if (zone === "nav" && dir === toMain) { focusFirstMain(); }
  }
  function goBack() { if (zoneOf(document.activeElement) === "main") { focusEl(activeNavItem()); } }
  function confirm() {
    var el = document.activeElement;
    if (el && el.tagName === "BUTTON") { el.click(); } else if (!zoneOf(el)) { focusEl(activeNavItem()); }
  }

  var KEYDIR = { 37: "left", 38: "up", 39: "right", 40: "down" };
  function onKeyDown(e) {
    var k = e.keyCode, t = e.target, inField = t && t.tagName === "INPUT";
    if (e.ctrlKey || e.altKey || e.metaKey) { return; }
    if (KEYDIR[k]) {
      flash(KEYDIR[k]);
      if (inField && (k === 37 || k === 39)) { return; } /* laisser le curseur du champ */
      e.preventDefault(); move(KEYDIR[k]);
    } else if (k === 13) {
      flash("confirm"); e.preventDefault();
      if (inField) { move("down"); } else { confirm(); }
    } else if (k === 27 || (k === 8 && !inField)) {
      flash("back"); e.preventDefault(); goBack();
    } else if (k === 33 && !inField) { e.preventDefault(); switchBy(-1); }
    else if (k === 34 && !inField) { e.preventDefault(); switchBy(1); }
  }

  /* ---------- Manette (Gamepad API, si disponible) ---------- */
  var padMemo = {}, padLabel = "";
  function getPads() {
    try {
      var g = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null);
      return g || [];
    } catch (e) { return []; }
  }
  function edge(name, on, repeat, now) {
    var s = padMemo[name] || (padMemo[name] = { on: false, next: 0 });
    if (!on) { s.on = false; return false; }
    if (!s.on) { s.on = true; s.next = now + 350; return true; }
    if (repeat && now >= s.next) { s.next = now + 120; return true; }
    return false;
  }
  function pollPad() {
    var pads = getPads(), p = null, i, now = new Date().getTime();
    for (i = 0; i < pads.length; i++) { if (pads[i]) { p = pads[i]; break; } }
    var label = p ? "Manette : détectée" : "Manette : non détectée. Appuie sur un de ses boutons.";
    if (label !== padLabel) { padLabel = label; $("padState").textContent = label; }
    if (p) {
      var b = function (n) { return !!(p.buttons && p.buttons[n] && (p.buttons[n].pressed || p.buttons[n] === 1)); };
      var ax = p.axes || [0, 0];
      var acts = [
        ["up", b(12) || ax[1] < -0.6, true], ["down", b(13) || ax[1] > 0.6, true],
        ["left", b(14) || ax[0] < -0.6, true], ["right", b(15) || ax[0] > 0.6, true],
        ["confirm", b(0), false], ["back", b(1), false], ["prev", b(4), false], ["next", b(5), false]
      ];
      for (i = 0; i < acts.length; i++) {
        if (!edge(acts[i][0], acts[i][1], acts[i][2], now)) { continue; }
        var a = acts[i][0];
        if (a === "prev") { switchBy(-1); } else if (a === "next") { switchBy(1); }
        else {
          flash(a);
          if (a === "confirm") { confirm(); } else if (a === "back") { goBack(); } else { move(a); }
        }
      }
    }
    if (window.requestAnimationFrame) { window.requestAnimationFrame(pollPad); } else { setTimeout(pollPad, 50); }
  }
  function initPad() {
    if (!(navigator.getGamepads || navigator.webkitGetGamepads)) {
      $("padState").textContent = "Manette : API non prise en charge. Utilise le clavier (flèches, Entrée, Échap).";
      return;
    }
    pollPad();
  }

  /* ---------- Événements ---------- */
  function onClick(e) {
    var el = e.target, a;
    while (el && el !== document) {
      if (el.getAttribute) {
        if ((a = el.getAttribute("data-page"))) { showPage(a); return; }
        if ((a = el.getAttribute("data-go"))) { showPage(a); focusFirstMain(); return; }
        if ((a = el.getAttribute("data-unit-target"))) { setUnit(a, units[a] === "GB" ? "TB" : "GB"); calcStorage(); return; }
        if ((a = el.getAttribute("data-fill"))) {
          $(a).value = el.getAttribute("data-value"); setUnit(a.replace("Val", ""), el.getAttribute("data-unit")); calcStorage(); return;
        }
        if ((a = el.getAttribute("data-step"))) { stepUsed(Number(a)); return; }
      }
      el = el.parentNode;
    }
  }

  function init() {
    initHome();
    document.addEventListener("click", onClick, false);
    document.addEventListener("keydown", onKeyDown, false);
    $("netTest").addEventListener("click", testConnection, false);
    $("diagRun").addEventListener("click", runDiagnostic, false);
    ["capVal", "usedVal", "gameVal"].forEach(function (id) { $(id).addEventListener("input", calcStorage, false); });
    window.addEventListener("hashchange", function () { if (hashName() !== current) { showPage(hashName()); } }, false);
    window.addEventListener("resize", function () { if (current === "console") { renderConsole(); } }, false);
    window.addEventListener("online", function () { if (current === "network") { renderNetwork(); } }, false);
    window.addEventListener("offline", function () { if (current === "network") { renderNetwork(); } }, false);
    showPage(hashName());
    initPad();
    if (!("ontouchstart" in window)) { focusEl(activeNavItem()); }
  }

  try { init(); }
  catch (err) {
    var s = document.getElementById("homeState");
    if (s) { s.textContent = "Erreur au démarrage : " + err.message; s.className = "v ko"; }
  }
})();

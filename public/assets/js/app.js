/* RateBoard — converter, rates table and history chart. No dependencies. */
(function () {
  "use strict";

  // Latest rates for ~160 currencies, updated daily. Free, no key; attribution required (see footer).
  var LATEST_URL = "https://open.er-api.com/v6/latest/USD";
  // Daily reference rates from the European Central Bank, used for the history chart.
  var HISTORY_URL = "https://api.frankfurter.dev/v1/";
  var HISTORY_CODES = ["AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF",
    "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "RON", "SEK",
    "SGD", "THB", "TRY", "USD", "ZAR"];
  var MAJORS = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "AED"];
  var CACHE_KEY = "rb-latest-v1";
  var CACHE_MS = 60 * 60 * 1000;

  var $ = function (id) { return document.getElementById(id); };
  var names = (typeof Intl.DisplayNames === "function")
    ? new Intl.DisplayNames(["en"], { type: "currency" }) : null;

  var state = { rates: null, updated: null, from: "USD", to: "EUR", amount: 1, range: 30 };

  function currencyName(code) {
    try { return names ? names.of(code) : code; } catch (e) { return code; }
  }

  function cross(from, to) {
    if (!state.rates || !state.rates[from] || !state.rates[to]) return NaN;
    return state.rates[to] / state.rates[from];
  }

  function fmtRate(n) {
    if (!isFinite(n)) return "–";
    var a = Math.abs(n);
    var opts = a >= 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : a >= 1 ? { minimumFractionDigits: 4, maximumFractionDigits: 4 }
      : { maximumSignificantDigits: 4 };
    return n.toLocaleString("en-US", opts);
  }

  function fmtAmount(n) {
    if (!isFinite(n)) return "–";
    var a = Math.abs(n);
    var opts = a >= 1 || a === 0 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumSignificantDigits: 4 };
    return n.toLocaleString("en-US", opts);
  }

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* ---------- Data ---------- */

  function loadLatest() {
    var cached = null;
    try { cached = JSON.parse(storageGet(CACHE_KEY) || "null"); } catch (e) { cached = null; }
    if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.data);

    return fetch(LATEST_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (data.result !== "success" || !data.rates) throw new Error("Bad response");
        storageSet(CACHE_KEY, JSON.stringify({ at: Date.now(), data: data }));
        return data;
      })
      .catch(function (err) {
        if (cached) return cached.data; // stale beats nothing
        throw err;
      });
  }

  /* ---------- URL state ---------- */

  function readUrl() {
    var p = new URLSearchParams(location.search);
    var from = (p.get("from") || "").toUpperCase();
    var to = (p.get("to") || "").toUpperCase();
    var amount = parseFloat(p.get("amount"));
    if (/^[A-Z]{3}$/.test(from)) state.from = from;
    if (/^[A-Z]{3}$/.test(to)) state.to = to;
    if (isFinite(amount) && amount >= 0) state.amount = amount;
  }

  function writeUrl() {
    var p = new URLSearchParams(location.search);
    p.set("from", state.from);
    p.set("to", state.to);
    if (state.amount !== 1) p.set("amount", String(state.amount)); else p.delete("amount");
    history.replaceState(null, "", location.pathname + "?" + p.toString() + location.hash);
  }

  /* ---------- Converter board ---------- */

  function fillSelect(select, codes, value) {
    select.innerHTML = "";
    codes.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c + " – " + currencyName(c);
      select.appendChild(o);
    });
    select.value = value;
  }

  function flapText(node, text) {
    if (node.getAttribute("data-value") === text) return;
    node.setAttribute("data-value", text);
    node.textContent = "";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { node.textContent = text; return; }
    Array.prototype.forEach.call(text, function (ch, i) {
      var s = document.createElement("span");
      s.className = "flap";
      s.style.animationDelay = (i * 22) + "ms";
      s.textContent = ch;
      node.appendChild(s);
    });
  }

  function renderBoard() {
    var rate = cross(state.from, state.to);
    var result = state.amount * rate;
    $("eq").textContent = fmtAmount(state.amount) + " " + currencyName(state.from) + " =";
    var value = $("result-value");
    flapText(value, fmtAmount(result));
    value.setAttribute("aria-label", fmtAmount(result) + " " + currencyName(state.to));
    $("result-unit").textContent = state.to;
    $("rate-fwd").textContent = "1 " + state.from + " = " + fmtRate(rate) + " " + state.to;
    $("rate-inv").textContent = "1 " + state.to + " = " + fmtRate(1 / rate) + " " + state.from;
    document.title = state.from + " to " + state.to + " – " + fmtRate(rate) + " | RateBoard";

    var list = $("majors");
    list.innerHTML = "";
    MAJORS.filter(function (c) { return c !== state.from && state.rates[c]; }).slice(0, 8).forEach(function (c) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.title = "Convert " + state.from + " to " + currencyName(c);
      b.innerHTML = '<span class="code"></span><span class="val"></span>';
      b.querySelector(".code").textContent = c;
      b.querySelector(".val").textContent = fmtRate(cross(state.from, c));
      b.addEventListener("click", function () { setPair(state.from, c); });
      li.appendChild(b);
      list.appendChild(li);
    });
    $("majors-caption").textContent = "1 " + state.from + " buys";
  }

  function setPair(from, to) {
    state.from = from;
    state.to = to;
    $("from").value = from;
    $("to").value = to;
    update();
  }

  function update() {
    renderBoard();
    writeUrl();
    loadHistory();
    if ($("table-base").value !== state.from) {
      $("table-base").value = state.from;
      renderTable();
    }
  }

  /* ---------- Rates table ---------- */

  function renderTable() {
    var base = $("table-base").value;
    var q = $("table-search").value.trim().toLowerCase();
    var tbody = $("rates-body");
    var codes = Object.keys(state.rates).sort();
    var rows = codes.filter(function (c) {
      if (c === base) return false;
      if (!q) return true;
      return c.toLowerCase().indexOf(q) !== -1 || currencyName(c).toLowerCase().indexOf(q) !== -1;
    });

    $("th-rate").textContent = "1 " + base + " =";
    $("th-inverse").textContent = "In " + base;
    var frag = document.createDocumentFragment();
    rows.forEach(function (c) {
      var r = cross(base, c);
      var tr = document.createElement("tr");
      tr.innerHTML = '<td class="code"></td><td></td><td class="num"></td><td class="num"></td><td></td>';
      var td = tr.children;
      td[0].textContent = c;
      td[1].textContent = currencyName(c);
      td[2].textContent = fmtRate(r) + " " + c;
      td[3].textContent = fmtRate(1 / r) + " " + base;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "linklike";
      b.textContent = "Convert";
      b.setAttribute("aria-label", "Convert " + base + " to " + c);
      b.addEventListener("click", function () {
        setPair(base, c);
        $("converter").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      td[4].appendChild(b);
      frag.appendChild(tr);
    });
    tbody.innerHTML = "";
    tbody.appendChild(frag);
    $("table-empty").hidden = rows.length > 0;
    $("table-count").textContent = rows.length + " currencies";
  }

  /* ---------- History chart ---------- */

  var historyToken = 0;
  var lastSeries = null;

  function isoDate(d) { return d.toISOString().slice(0, 10); }

  function loadHistory() {
    var token = ++historyToken;
    var box = $("chart");
    $("chart-title").textContent = state.from + " to " + state.to + " over the last " + rangeLabel(state.range);

    if (state.from === state.to) return chartMessage("Pick two different currencies to see a chart.");
    if (HISTORY_CODES.indexOf(state.from) === -1 || HISTORY_CODES.indexOf(state.to) === -1) {
      return chartMessage("History is available for 31 major currencies. " +
        (HISTORY_CODES.indexOf(state.from) === -1 ? state.from : state.to) + " isn't one of them yet.");
    }

    var end = new Date();
    var start = new Date(end.getTime() - state.range * 86400000);
    var url = HISTORY_URL + isoDate(start) + ".." + "?base=" + state.from + "&symbols=" + state.to;
    box.setAttribute("aria-busy", "true");

    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        if (token !== historyToken) return;
        var series = Object.keys(data.rates || {}).sort().map(function (d) {
          return { date: d, value: data.rates[d][state.to] };
        }).filter(function (p) { return isFinite(p.value); });
        if (series.length < 2) return chartMessage("Not enough history for this pair yet.");
        lastSeries = series;
        drawChart(series);
      })
      .catch(function () {
        if (token !== historyToken) return;
        chartMessage("The chart couldn't load. Check your connection, then pick a range to try again.");
      })
      .then(function () { box.removeAttribute("aria-busy"); });
  }

  function rangeLabel(days) {
    return days === 30 ? "month" : days === 90 ? "3 months" : "year";
  }

  function chartMessage(text) {
    lastSeries = null;
    $("chart-stats").hidden = true;
    $("chart").innerHTML = "";
    var p = document.createElement("p");
    p.className = "chart__msg";
    p.textContent = text;
    $("chart").appendChild(p);
  }

  function drawChart(series) {
    var box = $("chart");
    var W = Math.max(box.clientWidth, 280), H = box.clientHeight || 260;
    var padL = 8, padR = 8, padT = 22, padB = 40;
    var vals = series.map(function (p) { return p.value; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = max - min || max * 0.01 || 1;
    var x = function (i) { return padL + (i / (series.length - 1)) * (W - padL - padR); };
    var y = function (v) { return padT + (1 - (v - min) / span) * (H - padT - padB); };

    var line = series.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.value).toFixed(1); }).join(" ");
    var area = line + " L" + x(series.length - 1).toFixed(1) + " " + (H - padB) + " L" + x(0).toFixed(1) + " " + (H - padB) + " Z";
    var first = series[0], last = series[series.length - 1];
    var rising = last.value >= first.value;
    var stroke = rising ? "var(--up)" : "var(--down)";

    box.innerHTML =
      '<svg role="img" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">' +
      "<title>" + state.from + " to " + state.to + " from " + first.date + " to " + last.date + "</title>" +
      '<path d="' + area + '" fill="' + stroke + '" opacity="0.10"/>' +
      '<path d="' + line + '" fill="none" stroke="' + stroke + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(max) + '" y2="' + y(max) + '" stroke="var(--line)" stroke-dasharray="3 4"/>' +
      '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(min) + '" y2="' + y(min) + '" stroke="var(--line)" stroke-dasharray="3 4"/>' +
      '<text x="' + padL + '" y="' + (y(max) - 6) + '" font-size="12" fill="var(--ink-soft)">High ' + fmtRate(max) + "</text>" +
      '<text x="' + padL + '" y="' + (y(min) + 15) + '" font-size="12" fill="var(--ink-soft)">Low ' + fmtRate(min) + "</text>" +
      '<text x="' + padL + '" y="' + (H - 6) + '" font-size="12" fill="var(--ink-soft)">' + niceDate(first.date) + "</text>" +
      '<text x="' + (W - padR) + '" y="' + (H - 6) + '" font-size="12" fill="var(--ink-soft)" text-anchor="end">' + niceDate(last.date) + "</text>" +
      '<line id="cross" y1="' + padT + '" y2="' + (H - padB) + '" stroke="var(--ink-soft)" visibility="hidden"/>' +
      '<circle id="dot" r="4" fill="' + stroke + '" visibility="hidden"/>' +
      '<text id="tip" font-size="12" font-weight="700" fill="var(--ink)" visibility="hidden"></text>' +
      "</svg>";

    var svg = box.querySelector("svg");
    var cl = svg.querySelector("#cross"), dot = svg.querySelector("#dot"), tip = svg.querySelector("#tip");
    svg.addEventListener("pointermove", function (e) {
      var rect = svg.getBoundingClientRect();
      var px = (e.clientX - rect.left) * (W / rect.width);
      var i = Math.round(((px - padL) / (W - padL - padR)) * (series.length - 1));
      i = Math.max(0, Math.min(series.length - 1, i));
      var cx = x(i), cy = y(series[i].value);
      cl.setAttribute("x1", cx); cl.setAttribute("x2", cx);
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
      tip.textContent = niceDate(series[i].date) + "  " + fmtRate(series[i].value);
      var anchorEnd = cx > W / 2;
      tip.setAttribute("x", anchorEnd ? cx - 8 : cx + 8);
      tip.setAttribute("text-anchor", anchorEnd ? "end" : "start");
      tip.setAttribute("y", 14);
      [cl, dot, tip].forEach(function (n) { n.setAttribute("visibility", "visible"); });
    });
    svg.addEventListener("pointerleave", function () {
      [cl, dot, tip].forEach(function (n) { n.setAttribute("visibility", "hidden"); });
    });

    var change = (last.value - first.value) / first.value * 100;
    $("stat-open").textContent = fmtRate(first.value);
    $("stat-close").textContent = fmtRate(last.value);
    $("stat-high").textContent = fmtRate(max);
    $("stat-low").textContent = fmtRate(min);
    var ch = $("stat-change");
    ch.textContent = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
    ch.className = change >= 0 ? "up" : "down";
    $("chart-stats").hidden = false;
  }

  function niceDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  /* ---------- Wire up ---------- */

  function bind() {
    var amount = $("amount");
    amount.value = String(state.amount);
    amount.addEventListener("input", function () {
      var n = parseFloat(amount.value.replace(/,/g, ""));
      state.amount = isFinite(n) && n >= 0 ? n : 0;
      renderBoard();
      writeUrl();
    });
    $("from").addEventListener("change", function (e) { state.from = e.target.value; update(); });
    $("to").addEventListener("change", function (e) { state.to = e.target.value; update(); });
    $("swap").addEventListener("click", function () { setPair(state.to, state.from); });
    $("converter-form").addEventListener("submit", function (e) { e.preventDefault(); });

    $("table-base").addEventListener("change", renderTable);
    $("table-search").addEventListener("input", renderTable);

    Array.prototype.forEach.call(document.querySelectorAll(".range-tabs button"), function (b) {
      b.addEventListener("click", function () {
        state.range = Number(b.getAttribute("data-range"));
        Array.prototype.forEach.call(document.querySelectorAll(".range-tabs button"), function (o) {
          o.setAttribute("aria-pressed", String(o === b));
        });
        loadHistory();
      });
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (lastSeries) drawChart(lastSeries); }, 150);
    });
  }

  function start() {
    readUrl();
    loadLatest().then(function (data) {
      state.rates = data.rates;
      var codes = Object.keys(data.rates).sort();
      if (!data.rates[state.from]) state.from = "USD";
      if (!data.rates[state.to]) state.to = "EUR";
      fillSelect($("from"), codes, state.from);
      fillSelect($("to"), codes, state.to);
      fillSelect($("table-base"), codes, state.from);

      var updated = new Date(data.time_last_update_unix * 1000);
      $("updated").textContent = "Rates updated " + updated.toLocaleString(undefined, {
        dateStyle: "medium", timeStyle: "short"
      }) + ". Refreshed once a day.";

      bind();
      renderBoard();
      renderTable();
      loadHistory();
      document.body.classList.add("is-ready");
    }).catch(function () {
      $("status").textContent = "Today's rates couldn't load. Check your connection and reload the page.";
      $("result-value").textContent = "–";
    });
  }

  start();
})();

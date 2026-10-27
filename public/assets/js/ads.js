/* Fills every [data-ad] slot, the corner video and the popup from AD_CONFIG. */
(function () {
  "use strict";

  var cfg = window.AD_CONFIG || {};
  var slots = cfg.slots || {};
  var adsenseLoaded = false;

  var FIXED_SIZES = {
    "rail-left": [160, 600],
    "rail-right": [300, 600],
    "rail-right-2": [300, 250]
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function loadAdsense() {
    if (adsenseLoaded || !cfg.adsenseClient) return;
    adsenseLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(cfg.adsenseClient);
    document.head.appendChild(s);
  }

  function placeholder(size, what) {
    return el("a", { class: "ad-placeholder", href: cfg.advertiseUrl || "/advertise.html" }, [
      el("strong", { text: what ? "Your " + what + " here" : "Your ad here" }),
      el("span", { class: "size", text: size }),
      el("span", { text: "See prices and availability" })
    ]);
  }

  function directAd(ad) {
    var img = el("img", { src: ad.image, alt: ad.alt || "Advertisement", loading: "lazy" });
    if (!ad.clickUrl) return img;
    return el("a", { class: "ad-direct", href: ad.clickUrl, target: "_blank", rel: "sponsored noopener" }, [img]);
  }

  function adsenseUnit(name, slotId) {
    loadAdsense();
    var ins = el("ins", {
      class: "adsbygoogle",
      "data-ad-client": cfg.adsenseClient,
      "data-ad-slot": slotId
    });
    var fixed = FIXED_SIZES[name];
    if (fixed) {
      ins.style.width = fixed[0] + "px";
      ins.style.height = fixed[1] + "px";
    } else {
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
    }
    return ins;
  }

  function fillSlot(node) {
    var name = node.getAttribute("data-ad");
    var slot = slots[name] || {};
    var content = null;
    var isAdsense = false;

    if (slot.image) {
      content = directAd(slot);
    } else if (cfg.adsenseClient && slot.adsenseSlot) {
      content = adsenseUnit(name, slot.adsenseSlot);
      isAdsense = true;
    } else if (cfg.showPlaceholders) {
      content = placeholder(slot.size || "", "");
    }

    if (!content) {
      node.hidden = true;
      return;
    }
    var body = el("div", { class: "ad__body" }, [content]);
    node.appendChild(el("span", { class: "ad__label", text: "Advertisement" }));
    node.appendChild(body);
    if (isAdsense) {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
    }
  }

  /* ---------- Corner video ---------- */

  function setupVideo() {
    var v = cfg.video || {};
    if (!v.enabled) return;
    var hasAd = !!v.src;
    if (!hasAd && !cfg.showPlaceholders) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var media;
    if (hasAd) {
      var video = el("video", { playsinline: "", muted: "", loop: "", preload: "metadata", "aria-label": "Video advertisement" });
      video.muted = true;
      if (v.poster) video.poster = v.poster;
      video.src = v.src;
      if (!reduceMotion) video.autoplay = true; else video.controls = true;
      media = v.clickUrl
        ? el("a", { href: v.clickUrl, target: "_blank", rel: "sponsored noopener" }, [video])
        : video;
    } else {
      media = placeholder("16:9 video, plays muted", "video ad");
    }

    var close = el("button", { type: "button", class: "video-ad__close", "aria-label": "Close video ad" });
    close.innerHTML = 'Close <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2"/></svg>';

    var box = el("aside", { class: "video-ad", "aria-label": "Advertisement", hidden: "" }, [
      el("div", { class: "video-ad__bar" }, [el("span", { text: "Advertisement" }), close]),
      el("div", { class: "video-ad__media" }, [media])
    ]);
    close.addEventListener("click", function () {
      var vid = box.querySelector("video");
      if (vid) vid.pause();
      box.remove();
    });
    document.body.appendChild(box);
    setTimeout(function () { box.hidden = false; }, (v.delaySeconds || 0) * 1000);
  }

  /* ---------- Full-screen popup ---------- */

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { /* private mode */ }
  }

  function setupInterstitial() {
    var p = cfg.interstitial || {};
    if (!p.enabled) return;
    var hasAd = !!p.image;
    if (!hasAd && !cfg.showPlaceholders) return;

    var KEY = "rb-interstitial-shown";
    var last = Number(storageGet(KEY) || 0);
    var gap = (p.everyHours || 24) * 3600 * 1000;
    if (Date.now() - last < gap) return;

    var close = el("button", { type: "button", class: "interstitial__close" });
    close.innerHTML = 'Close ad <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2"/></svg>';

    var content = hasAd ? directAd(p) : placeholder("Full-screen popup, 640×480", "ad");
    var panel = el("div", {
      class: "interstitial__panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Advertisement"
    }, [
      el("div", { class: "interstitial__bar" }, [el("span", { text: "Advertisement" }), close]),
      el("div", { class: "interstitial__body" }, [content])
    ]);
    var overlay = el("div", { class: "interstitial", hidden: "" }, [panel]);
    var previousFocus = null;

    function shut() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") shut();
      if (e.key === "Tab") {
        var f = panel.querySelectorAll("a, button");
        var first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    }
    close.addEventListener("click", shut);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) shut(); });

    document.body.appendChild(overlay);
    setTimeout(function () {
      previousFocus = document.activeElement;
      overlay.hidden = false;
      storageSet(KEY, String(Date.now()));
      document.addEventListener("keydown", onKey);
      close.focus();
    }, (p.delaySeconds || 0) * 1000);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-ad]"), fillSlot);
    setupVideo();
    setupInterstitial();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

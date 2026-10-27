/*
 * Ad settings — the only file you need to edit to turn ads on.
 *
 * Each slot is filled in this order:
 *   1. A direct-sold ad (image + clickUrl), if you set one.
 *   2. An AdSense unit, if adsenseClient and the slot's adsenseSlot are set.
 *   3. A "Your ad here" box linking to the advertise page, if showPlaceholders is true.
 *   4. Otherwise the slot stays empty and takes no space.
 *
 * The corner video and the full-screen popup only take direct-sold ads.
 * AdSense does not allow its ads inside pop-ups or floating boxes; use
 * AdSense Auto ads "Vignette" and "Anchor" formats for that instead (see README).
 */
window.AD_CONFIG = {
  // Your AdSense publisher ID, e.g. "ca-pub-1234567890123456". Leave empty until approved.
  adsenseClient: "",

  // Show "Your ad here" boxes in unsold slots. Set to false to hide them.
  showPlaceholders: true,

  // Where the "Your ad here" boxes link to.
  advertiseUrl: "/advertise.html",

  // Display slots. adsenseSlot is the numeric ad unit ID from AdSense.
  // For a direct-sold ad, add: image: "/assets/img/ads/acme-728x90.png", clickUrl: "https://...", alt: "Acme Bank"
  slots: {
    "top-banner":    { size: "728×90 / 320×100",  adsenseSlot: "" },
    "rail-left":     { size: "160×600",           adsenseSlot: "" },
    "rail-right":    { size: "300×600",           adsenseSlot: "" },
    "rail-right-2":  { size: "300×250",           adsenseSlot: "" },
    "tile-1":        { size: "300×250",           adsenseSlot: "" },
    "tile-2":        { size: "300×250",           adsenseSlot: "" },
    "tile-3":        { size: "300×250",           adsenseSlot: "" },
    "in-content":    { size: "728×90 / 320×100",  adsenseSlot: "" },
    "tile-4":        { size: "300×250",           adsenseSlot: "" },
    "tile-5":        { size: "300×250",           adsenseSlot: "" },
    "tile-6":        { size: "300×250",           adsenseSlot: "" },
    "footer-banner": { size: "728×90 / 320×100",  adsenseSlot: "" }
  },

  // Bottom-right video ad. Plays muted; the visitor can close it.
  video: {
    enabled: true,
    src: "",        // e.g. "/assets/video/acme-15s.mp4"
    poster: "",     // optional still image shown before the video loads
    clickUrl: "",   // where a click on the video goes
    delaySeconds: 6 // wait this long after page load before showing it
  },

  // Full-screen popup ad. Shown at most once per `everyHours` per visitor.
  interstitial: {
    enabled: true,
    image: "",       // e.g. "/assets/img/ads/acme-640x480.png"
    clickUrl: "",
    alt: "",
    delaySeconds: 12,
    everyHours: 24
  }
};

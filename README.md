# RateBoard

A static currency converter and exchange-rate site with ad slots, ready for Cloudflare.
There is no build step: everything the site needs is in `public/`.

- Converter for about 160 currencies, using daily rates from [Exchange Rate API](https://www.exchangerate-api.com) (free, no key).
- History chart for 31 major currencies, using European Central Bank rates from [Frankfurter](https://frankfurter.dev).
- Table of every rate against a base currency you choose, with search.
- Conversions live in the page address (`/?from=USD&to=PKR&amount=500`), so they can be shared and indexed.

## Files

```
public/
  index.html              converter, chart, rates table, FAQ
  advertise.html          placements and how to book them
  about.html, privacy.html, terms.html, 404.html
  ads.txt                 AdSense seller declaration (edit before going live)
  robots.txt, sitemap.xml (replace example.com with your domain)
  _headers                Cloudflare caching and security headers
  assets/css/site.css
  assets/js/ads-config.js the only file you edit to turn ads on
  assets/js/ads.js        renders the ad slots, corner video and popup
  assets/js/app.js        converter, table and chart
wrangler.jsonc            Cloudflare Workers config
```

## Try it locally

```sh
cd public && python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to Cloudflare

Either option serves `public/` as a static site.

**From GitHub (easiest):** in the Cloudflare dashboard go to Workers & Pages, choose Create, connect this
repository and deploy. The `wrangler.jsonc` file tells Cloudflare to serve the `public` folder.
Every push to the branch then redeploys the site.

**From your computer:**

```sh
npx wrangler login
npx wrangler deploy
```

Then add your domain under the Worker's Settings > Domains & Routes.

## Before you go live

1. Replace `example.com` in `public/robots.txt` and `public/sitemap.xml` with your domain.
2. Replace `ads@example.com` and `hello@example.com` in `advertise.html`, `about.html` and `privacy.html`.
3. Rename "RateBoard" if you want a different name. Search for it across `public/`.

## Ad slots

Every page has these slots:

| Slot name in config | Size | Position |
|---|---|---|
| `top-banner` | 728×90, 320×100 on phones | Above the header |
| `rail-left` | 160×600 | Left side, sticky, screens 1320px and wider |
| `rail-right`, `rail-right-2` | 300×600 and 300×250 | Right side, sticky, screens 1080px and wider |
| `tile-1` to `tile-6` | 300×250 | Two rows of three tiles on the home page |
| `in-content` | 728×90 | Between the chart and the rates table |
| `footer-banner` | 728×90 | Above the footer |
| `video` | 16:9 MP4 | Fixed in the bottom-right corner, muted, closable |
| `interstitial` | 640×480 image | Full-screen popup, once per visitor per day, closes with a click or Esc |

Unsold slots show a "Your ad here" box that links to the advertise page. Set `showPlaceholders: false` in
`ads-config.js` to hide them instead.

### Selling a slot directly

Put the image in `public/assets/img/ads/` and point the slot at it in `ads-config.js`:

```js
"top-banner": { size: "728×90 / 320×100", image: "/assets/img/ads/acme-728x90.png", clickUrl: "https://acme.example", alt: "Acme Bank" },
```

A direct ad overrides AdSense for that slot. The corner video uses `video.src` and `video.clickUrl`;
the popup uses `interstitial.image` and `interstitial.clickUrl`.

### Turning on AdSense

1. Apply for AdSense with your live domain. Google reviews the site first; the About, Privacy and Terms
   pages and the FAQ content are there to help that review.
2. Once approved, set `adsenseClient: "ca-pub-..."` in `public/assets/js/ads-config.js`.
3. In AdSense, create a display ad unit for each slot you want Google to fill and paste its ID into that
   slot's `adsenseSlot`.
4. Put your publisher ID in `public/ads.txt` and delete the comment line.
5. In AdSense, go to Privacy & messaging and turn on the consent message for European visitors. Google
   requires a certified consent tool there, and its own message is free.

### The popup and the corner video with AdSense

AdSense does not allow its ads inside pop-ups, floating boxes or custom overlays, so `ads.js` only puts
direct-sold creatives in those two placements. To earn from Google in the same spots, turn on Auto ads
in AdSense and enable:

- **Vignette ads**: Google's own full-screen ad, shown between page views.
- **Anchor ads**: a banner pinned to the edge of the screen.

If you run Vignette ads, set `interstitial.enabled: false` so visitors don't get two full-screen ads.

Also keep in mind that Chrome blocks every ad on sites that fail the
[Better Ads Standards](https://www.betterads.org/standards/). The popup here stays within them: it waits
12 seconds, can be closed straight away, and shows once a day. Don't add a countdown before the close
button appears, and don't turn on sound for the corner video.

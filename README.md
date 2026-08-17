# Anato Lab — 3D Anatomy Model Store

A minimal, working storefront for selling downloadable 3D anatomy models,
styled after the dark, card-grid marketplace look (Fab.com-style), with
checkout that lets a customer pay by card while you receive settlement in
cryptocurrency (via NOWPayments' fiat-on-ramp).

## What's included

- Product grid with search + body-system filters (Cardiovascular, Skeletal,
  Nervous, Muscular — extend freely)
- Product detail page
- Email/password accounts (JWT in an httpOnly cookie)
- Checkout via NOWPayments: creates an invoice, customer pays by card or
  crypto on NOWPayments' hosted page, you settle in crypto
- IPN webhook that verifies NOWPayments' signature and marks the order paid
- "My library" page with order history and download links that only work
  once an order is marked paid
- SQLite database (a single file, `store.db` — no separate DB server needed)

## What is *not* included (on purpose, to keep this a clear starting point)

- An admin UI for adding products (use the `POST /api/products` endpoint
  below, or write a small internal form later)
- Email verification / password reset
- Rate limiting, HTTPS termination (put this behind a reverse proxy like
  Caddy or Nginx in production, or a host that provides TLS)
- Reviews/ratings, multi-item cart (each purchase is a single instant "buy
  now," which matches how most 3D-asset marketplaces work)

## 1. Install and run locally

```bash
npm install
cp .env.example .env      # then fill in the values, see below
npm run seed               # adds 4 sample products so the store isn't empty
npm start                  # http://localhost:3000
```

## 2. Set up the payment side (NOWPayments)

This is the part that answers "customer pays a normal way, I receive
crypto":

1. Create a business account at nowpayments.io and complete verification.
2. In **Store Settings → Payout wallet**, add the wallet address for the
   cryptocurrency you want to receive (USDT is the common choice for
   price stability).
3. In **Store Settings → API keys**, create a key → put it in `.env` as
   `NOWPAYMENTS_API_KEY`.
4. In **Store Settings → IPN**, generate an IPN secret → put it in `.env`
   as `NOWPAYMENTS_IPN_SECRET`. This is what lets the server verify that a
   "payment confirmed" webhook really came from NOWPayments and not
   someone spoofing the request.
5. In the payment-methods settings, confirm the card/fiat on-ramp option
   is turned on for your account (this is what lets a buyer pay by card
   while you settle in crypto). **Verify this is currently available for
   your account before launch** — provider features and country
   eligibility can change, so confirm directly with NOWPayments rather
   than relying on this README staying accurate over time.
6. Set `BASE_URL` in `.env` to your real public domain once deployed —
   NOWPayments needs to reach `BASE_URL/api/payments/ipn` from the
   internet, so this won't work with `localhost` in production.

If NOWPayments ever doesn't fit, the integration is isolated to
`src/routes/payments.js` — swapping in CoinGate, Plisio, or another
fiat-to-crypto processor means rewriting that one file; nothing else in
the app depends on which provider you use.

## 3. Add your real products

There's no admin screen yet, so add products with a request to the API,
using the admin token from `.env`:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR_ADMIN_TOKEN" \
  -d '{
    "slug": "kidney-nephron-detail",
    "title": "Kidney with Nephron Cutaway",
    "system_tag": "Cardiovascular",
    "formats": "FBX, OBJ, glTF",
    "price_usd": 34.99,
    "short_desc": "Full kidney model with a nephron-level cutaway section.",
    "long_desc": "Longer description for the product page.",
    "thumb_path": "/img/your-thumb.jpg",
    "file_path": "uploads/downloads/kidney-nephron-detail.zip",
    "poly_count": "38,000 tris"
  }'
```

Put the actual downloadable file at the `file_path` you specify (relative
to the project root, outside `public/` so it can't be downloaded without
going through the paid-order check), and a thumbnail image under
`public/img/`.

## 4. Deploy

Any Node host works (a small VPS, Railway, Render, Fly.io, etc.). Put it
behind HTTPS, set the real `.env` values there, and make sure `BASE_URL`
matches the public URL so NOWPayments' webhook can reach it.

## A note on the business side

This scaffold makes the *card → crypto* checkout technically possible, but
it doesn't cover tax treatment, invoicing requirements, or reporting
obligations in your country for receiving cryptocurrency as revenue from
digital sales. Worth a short conversation with an accountant before you
launch for real — not something to get from a README.

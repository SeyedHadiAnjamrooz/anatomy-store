const express = require("express");
const crypto = require("crypto");
const fetch = require("node-fetch");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

// Customer clicks "Buy" on a product -> we create a pending order, then ask
// NOWPayments for an invoice URL. The invoice page is where the customer
// chooses "pay by card" (fiat on-ramp) or a crypto wallet; either way, you
// receive crypto in the wallet configured in your NOWPayments dashboard.
router.post("/checkout/:productId", requireAuth, async (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  const orderInfo = db
    .prepare("INSERT INTO orders (user_id, product_id, amount_usd, status) VALUES (?, ?, ?, 'pending')")
    .run(req.userId, product.id, product.price_usd);
  const orderId = orderInfo.lastInsertRowid;

  try {
    const invoiceRes = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: product.price_usd,
        price_currency: "usd",
        order_id: String(orderId),
        order_description: product.title,
        ipn_callback_url: `${process.env.BASE_URL}/api/payments/ipn`,
        success_url: `${process.env.BASE_URL}/account.html?paid=1`,
        cancel_url: `${process.env.BASE_URL}/product.html?slug=${product.slug}`,
      }),
    });
    const invoice = await invoiceRes.json();
    if (!invoiceRes.ok) {
      throw new Error(invoice.message || "NOWPayments rejected the invoice request.");
    }

    db.prepare("UPDATE orders SET invoice_url = ?, nowpayments_payment_id = ? WHERE id = ?").run(
      invoice.invoice_url,
      invoice.id || null,
      orderId
    );

    res.json({ ok: true, invoice_url: invoice.invoice_url, order_id: orderId });
  } catch (err) {
    res.status(502).json({ error: "Could not start checkout with the payment provider: " + err.message });
  }
});

// NOWPayments calls this URL directly (not the browser) when a payment's status
// changes. We verify the signature so nobody can fake a "paid" notification.
router.post("/ipn", express.json(), (req, res) => {
  const receivedSig = req.headers["x-nowpayments-sig"];
  const sortedBody = sortObject(req.body);
  const computedSig = crypto
    .createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET)
    .update(JSON.stringify(sortedBody))
    .digest("hex");

  if (computedSig !== receivedSig) {
    return res.status(401).send("Invalid signature");
  }

  const { order_id, payment_status } = req.body;
  if (payment_status === "finished" || payment_status === "confirmed") {
    db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(order_id);
  } else if (payment_status === "failed" || payment_status === "expired") {
    db.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").run(order_id);
  }
  res.sendStatus(200);
});

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key] && typeof obj[key] === "object" ? sortObject(obj[key]) : obj[key];
      return acc;
    }, {});
}

module.exports = router;

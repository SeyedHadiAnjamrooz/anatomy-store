const express = require("express");
const path = require("path");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.status, o.amount_usd, o.created_at, o.paid_at, p.title, p.slug, p.thumb_path
       FROM orders o JOIN products p ON p.id = o.product_id
       WHERE o.user_id = ? ORDER BY o.created_at DESC`
    )
    .all(req.userId);
  res.json({ orders });
});

// Only serves the file if this user has a paid order for that exact product.
router.get("/download/:orderId", requireAuth, (req, res) => {
  const order = db
    .prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?")
    .get(req.params.orderId, req.userId);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status !== "paid") return res.status(403).json({ error: "This order has not been paid yet." });

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(order.product_id);
  const filePath = path.join(__dirname, "..", "..", product.file_path);
  res.download(filePath, path.basename(product.file_path));
});

module.exports = router;

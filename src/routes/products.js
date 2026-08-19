const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/products?system=Cardiovascular&q=heart
router.get("/", (req, res) => {
  const { system, q } = req.query;
  let sql = "SELECT id, slug, title, system_tag, formats, price_usd, short_desc, thumb_path FROM products WHERE 1=1";
  const params = [];
  if (system) {
    sql += " AND system_tag = ?";
    params.push(system);
  }
  if (q) {
    sql += " AND (title LIKE ? OR short_desc LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY created_at DESC";
  const products = db.prepare(sql).all(...params);
  res.json({ products });
});

router.get("/systems", (_req, res) => {
  const rows = db.prepare("SELECT DISTINCT system_tag FROM products ORDER BY system_tag").all();
  res.json({ systems: rows.map((r) => r.system_tag) });
});

router.get("/:slug", (req, res) => {
  const product = db
    .prepare(
      "SELECT id, slug, title, system_tag, formats, price_usd, short_desc, long_desc, thumb_path, poly_count FROM products WHERE slug = ?"
    )
    .get(req.params.slug);
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json({ product });
});

// Admin-only: add or update a product. No admin UI is built yet -- call this with curl/Postman
// using the X-Admin-Token header, or write your own small internal form later.
// Submitting the same slug again updates that product instead of failing.
router.post("/", requireAdmin, (req, res) => {
  const { slug, title, system_tag, formats, price_usd, short_desc, long_desc, thumb_path, file_path, poly_count } =
    req.body;
  if (!slug || !title || !system_tag || !formats || !price_usd || !file_path) {
    return res.status(400).json({ error: "slug, title, system_tag, formats, price_usd, file_path are required." });
  }
  db.prepare(
    `INSERT INTO products (slug, title, system_tag, formats, price_usd, short_desc, long_desc, thumb_path, file_path, poly_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       title = excluded.title,
       system_tag = excluded.system_tag,
       formats = excluded.formats,
       price_usd = excluded.price_usd,
       short_desc = excluded.short_desc,
       long_desc = excluded.long_desc,
       thumb_path = excluded.thumb_path,
       file_path = excluded.file_path,
       poly_count = excluded.poly_count`
  ).run(slug, title, system_tag, formats, price_usd, short_desc || "", long_desc || "", thumb_path || "", file_path, poly_count);
  const row = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug);
  res.json({ ok: true, id: row.id });
});

module.exports = router;

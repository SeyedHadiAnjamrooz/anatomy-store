require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./src/routes/auth");
const productRoutes = require("./src/routes/products");
const paymentRoutes = require("./src/routes/payments");
const orderRoutes = require("./src/routes/orders");

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const apiRes = await fetch(`http://localhost:${req.socket.localPort}/api/products`);
    const { products } = await apiRes.json();
    const urls = [
      `<url><loc>${baseUrl}/</loc></url>`,
      ...products.map(p => `<url><loc>${baseUrl}/product.html?slug=${encodeURIComponent(p.slug)}</loc></url>`)
    ].join("");
    res.set("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch (err) {
    res.status(500).send("Sitemap generation failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Anatomy store running at http://localhost:${PORT}`));

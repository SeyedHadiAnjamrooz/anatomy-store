// Run with: npm run seed
// Adds a few sample products so the storefront isn't empty on first run.
// Replace thumb_path / file_path with your real files under /public/img and /uploads.
const db = require("./src/db");

const samples = [
  {
    slug: "heart-cardiovascular-system",
    title: "Human Heart & Coronary Vessels",
    system_tag: "Cardiovascular",
    formats: "FBX, OBJ, glTF",
    price_usd: 39.99,
    short_desc: "Anatomically accurate heart model with labeled chambers and coronary vasculature.",
    long_desc: "High-resolution heart model built from cross-sectional reference, with separate meshes for chambers, valves, and coronary arteries/veins. Includes a labeled and an unlabeled version.",
    thumb_path: "/img/sample-heart.svg",
    file_path: "uploads/downloads/heart-cardiovascular-system.zip",
    poly_count: "42,000 tris",
  },
  {
    slug: "skeletal-femur",
    title: "Human Femur (Full Detail)",
    system_tag: "Skeletal",
    formats: "FBX, OBJ, STL",
    price_usd: 8.99,
    short_desc: "High-detail femur with trabecular structure visible in cross-section.",
    long_desc: "Print-ready and render-ready femur model, topology cleaned for subdivision, includes a cutaway variant showing internal trabecular bone.",
    thumb_path: "/img/sample-femur.svg",
    file_path: "uploads/downloads/skeletal-femur.zip",
    poly_count: "18,500 tris",
  },
  {
    slug: "nervous-brain-brainstem",
    title: "Brain & Brainstem",
    system_tag: "Nervous",
    formats: "FBX, OBJ, glTF",
    price_usd: 49.99,
    short_desc: "Full brain model with cortical detail, brainstem, and cranial nerve origins.",
    long_desc: "Segmented into cerebrum, cerebellum, and brainstem, with cranial nerve stubs at correct exit points for teaching cranial nerve anatomy.",
    thumb_path: "/img/sample-brain.svg",
    file_path: "uploads/downloads/nervous-brain-brainstem.zip",
    poly_count: "65,000 tris",
  },
  {
    slug: "muscular-upper-limb",
    title: "Upper Limb Musculature",
    system_tag: "Muscular",
    formats: "FBX, OBJ",
    price_usd: 24.99,
    short_desc: "Layered shoulder-to-hand muscle model, superficial and deep layers separable.",
    long_desc: "Muscles grouped by layer (superficial/deep) and by compartment, so you can toggle visibility per teaching module.",
    thumb_path: "/img/sample-arm.svg",
    file_path: "uploads/downloads/muscular-upper-limb.zip",
    poly_count: "31,000 tris",
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO products
    (slug, title, system_tag, formats, price_usd, short_desc, long_desc, thumb_path, file_path, poly_count)
  VALUES (@slug, @title, @system_tag, @formats, @price_usd, @short_desc, @long_desc, @thumb_path, @file_path, @poly_count)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});

insertMany(samples);
console.log(`Seeded ${samples.length} sample products.`);

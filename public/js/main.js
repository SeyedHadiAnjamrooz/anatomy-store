const SYSTEM_COLORS = {
  Cardiovascular: '#c4433d',
  Skeletal: '#e8e1d3',
  Nervous: '#d9a441',
  Muscular: '#8b3a3a',
};
function colorFor(system) { return SYSTEM_COLORS[system] || '#4d8b93'; }

let activeSystem = '';
let searchTimer = null;

async function loadSystems() {
  const res = await fetch('/api/products/systems');
  const { systems } = await res.json();
  const wrap = document.getElementById('system-filters');
  systems.forEach((sys) => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.dataset.system = sys;
    chip.innerHTML = `<span class="chip-dot" style="background:${colorFor(sys)}"></span> ${sys}`;
    chip.addEventListener('click', () => {
      activeSystem = sys;
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      loadProducts();
    });
    wrap.appendChild(chip);
  });
  document.querySelector('.filter-chip[data-system=""]').addEventListener('click', (e) => {
    activeSystem = '';
    document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    e.currentTarget.classList.add('active');
    loadProducts();
  });
}

async function loadProducts() {
  const q = document.getElementById('search-input').value.trim();
  const params = new URLSearchParams();
  if (activeSystem) params.set('system', activeSystem);
  if (q) params.set('q', q);

  const res = await fetch('/api/products?' + params.toString());
  const { products } = await res.json();

  const grid = document.getElementById('product-grid');
  const count = document.getElementById('result-count');
  count.textContent = products.length === 1 ? '1 model' : `${products.length} models`;

  if (products.length === 0) {
    grid.innerHTML = '';
    count.textContent = 'No models match that filter yet.';
    return;
  }

  grid.innerHTML = products.map((p) => `
    <a class="card" href="/product.html?slug=${encodeURIComponent(p.slug)}">
      <div class="card-thumb">
        <img src="${p.thumb_path || '/img/sample-heart.svg'}" alt="${p.title}">
        <div class="sys-tag">
          <span class="chip-dot" style="background:${colorFor(p.system_tag)}"></span>${p.system_tag}
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <div class="card-meta">
          <span class="card-formats">${p.formats}</span>
          <span class="price">$${p.price_usd.toFixed(2)}</span>
        </div>
      </div>
    </a>
  `).join('');
}

document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 250);
});

loadSystems();
loadProducts();

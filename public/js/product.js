const SYSTEM_COLORS = {
  Cardiovascular: '#c4433d',
  Skeletal: '#e8e1d3',
  Nervous: '#d9a441',
  Muscular: '#8b3a3a',
};

async function init() {
  const slug = new URLSearchParams(location.search).get('slug');
  const root = document.getElementById('product-root');
  if (!slug) { root.innerHTML = '<p class="page-sub">No product specified.</p>'; return; }

  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  if (!res.ok) { root.innerHTML = '<p class="page-sub">Product not found.</p>'; return; }
  const { product: p } = await res.json();
  document.title = `${p.title} — Anatomy 3D Store`;

  root.innerHTML = `
    <div class="product-media">
      <img src="${p.thumb_path || '/img/sample-heart.svg'}" alt="${p.title}">
    </div>
    <div class="product-info">
      <div class="sys-tag" style="position:static; display:inline-flex; margin-bottom:12px;">
        <span class="chip-dot" style="background:${SYSTEM_COLORS[p.system_tag] || '#4d8b93'}"></span>${p.system_tag}
      </div>
      <h1>${p.title}</h1>
      <p class="product-desc">${p.short_desc || ''}</p>
      <div class="product-price">$${p.price_usd.toFixed(2)}</div>
      <button class="btn btn-primary btn-block" id="buy-btn">Buy &amp; download</button>
      <p class="form-msg" id="buy-msg"></p>
      <div class="spec-list">
        <div class="spec-row"><span>Formats</span><span>${p.formats}</span></div>
        <div class="spec-row"><span>Poly count</span><span>${p.poly_count || '—'}</span></div>
      </div>
      <p class="product-desc">${p.long_desc || ''}</p>
    </div>
  `;

  document.getElementById('buy-btn').addEventListener('click', async () => {
    const btn = document.getElementById('buy-btn');
    const msg = document.getElementById('buy-msg');
    msg.className = 'form-msg';
    btn.disabled = true;
    btn.textContent = 'Starting checkout…';

    const productRes = await fetch(`/api/products/${encodeURIComponent(slug)}`);
    const { product } = await productRes.json();

    const checkoutRes = await fetch(`/api/payments/checkout/${product.id}`, { method: 'POST' });
    if (checkoutRes.status === 401) {
      location.href = `/login.html?next=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }
    const data = await checkoutRes.json();
    btn.disabled = false;
    btn.textContent = 'Buy & download';
    if (!checkoutRes.ok) {
      msg.textContent = data.error || 'Something went wrong starting checkout.';
      msg.classList.add('error');
      return;
    }
    // Sends the customer to the hosted NOWPayments invoice, where they choose
    // "pay by card" or a crypto wallet. Either way, you receive crypto.
    location.href = data.invoice_url;
  });
}

init();

async function init() {
  const user = await getSession();
  if (!user) {
    location.href = '/login.html?next=' + encodeURIComponent('/account.html');
    return;
  }

  if (new URLSearchParams(location.search).get('paid') === '1') {
    document.getElementById('paid-banner').textContent =
      "Thanks — we're confirming your payment. It usually takes a minute or two after the blockchain confirms; refresh this page shortly.";
  }

  const res = await fetch('/api/orders');
  const { orders } = await res.json();
  const list = document.getElementById('orders-list');

  if (orders.length === 0) {
    list.innerHTML = '<div class="empty-state">No purchases yet. <a href="/" style="color:var(--accent)">Browse models</a>.</div>';
    return;
  }

  list.innerHTML = orders.map((o) => `
    <div class="order-row">
      <img src="${o.thumb_path || '/img/sample-heart.svg'}" alt="">
      <div style="flex:1">
        <div class="order-title">${o.title}</div>
        <div class="order-meta">$${o.amount_usd.toFixed(2)} &middot; ${new Date(o.created_at).toLocaleDateString()}</div>
      </div>
      <span class="status-pill status-${o.status}">${o.status}</span>
      ${o.status === 'paid'
        ? `<a class="btn btn-primary" href="/api/orders/download/${o.id}">Download</a>`
        : ''}
    </div>
  `).join('');
}

init();

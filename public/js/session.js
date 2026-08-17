async function getSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

async function renderNavRight() {
  const el = document.getElementById('nav-right');
  if (!el) return;
  const user = await getSession();
  if (user) {
    el.innerHTML = `
      <span style="color:var(--text-dim)">${user.email}</span>
      <a class="btn" href="/account.html">My library</a>
      <button class="btn" id="logout-btn">Log out</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      location.href = '/';
    });
  } else {
    el.innerHTML = `
      <a class="btn" href="/login.html">Log in</a>
      <a class="btn btn-primary" href="/register.html">Sign up</a>
    `;
  }
}

renderNavRight();

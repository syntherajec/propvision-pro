/* ============================================================
   PropVision Pro — Dashboard Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Guard
  if (!Auth.requireAuth()) return;

  const session = Auth.getSession();

  /* ---- Greeting ---- */
  const greetingEl = document.getElementById('hero-greeting');
  const nameEl     = document.getElementById('hero-name');
  const dateEl     = document.getElementById('hero-date');
  const userNameEl = document.getElementById('sb-user-name');
  const userInitEl = document.getElementById('sb-user-init');

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'SELAMAT PAGI' : hour < 15 ? 'SELAMAT SIANG' : hour < 18 ? 'SELAMAT SORE' : 'SELAMAT MALAM';

  if (greetingEl) greetingEl.textContent = greeting;
  if (nameEl)     nameEl.textContent = session.name;
  if (dateEl)     dateEl.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  if (userNameEl) userNameEl.textContent = session.name;
  if (userInitEl) userInitEl.textContent = session.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ---- Stats ---- */
  const history = HistoryManager.getAll();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = history.filter(h => new Date(h.savedAt) >= monthStart);
  const laporan   = thisMonth.filter(h => h.type === 'laporan');
  const cepat     = thisMonth.filter(h => h.type !== 'laporan');

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setVal('stat-total', thisMonth.length);
  setVal('stat-laporan', laporan.length);
  setVal('stat-cepat', cepat.length);

  // Trend: today's analyses
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today = history.filter(h => new Date(h.savedAt) >= todayStart);
  setVal('stat-trend', today.length > 0 ? `+${today.length} hari ini` : 'Mulai analisa');

  /* ---- Sidebar active state ---- */
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sb-item[data-page]').forEach(item => {
    if (item.getAttribute('data-page') === currentPage) {
      item.classList.add('active');
    }
  });

  /* ---- Mobile sidebar toggle ---- */
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');

  const openSidebar = () => {
    sidebar?.classList.add('open');
    overlay?.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar);

  /* ---- Logout ---- */
  document.querySelectorAll('[data-logout]').forEach(el => {
    el.addEventListener('click', () => Auth.logout());
  });

  /* ---- API Modal ---- */
  ModalManager.initApiModal();

  /* ---- Topbar date (tb-sub) ---- */
  const tbSub = document.getElementById('tb-date');
  if (tbSub) {
    tbSub.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }
});

/* ============================================================
   PropVision Pro — Auth System (Lisensi Kode)

   Cara kerja:
   - Admin generate kode di admin.html → tersimpan otomatis
   - Pembeli input kode → langsung bisa akses, tanpa upload ulang
   ============================================================ */

const Auth = (() => {

  /* ---- Lisensi bawaan (tidak bisa dihapus dari admin) ---- */
  const BUILTIN_LICENSES = [
    { code: 'PVP-DEMO-2026', name: 'Demo User', note: 'Akun demo' },
  ];

  const KEYS = {
    SESSION:    'pvp_session',
    ATTEMPTS:   'pvp_attempts',
    LOCK_UNTIL: 'pvp_lock_until',
    LICENSES:   'pvp_licenses'   // lisensi yang di-generate admin
  };

  const MAX_ATTEMPTS  = 5;
  const LOCK_DURATION = 60 * 1000;

  /* ---- Lisensi dari localStorage (di-generate admin) ---- */
  const getStoredLicenses = () => {
    try { return JSON.parse(localStorage.getItem(KEYS.LICENSES)) || []; }
    catch { return []; }
  };

  const saveStoredLicenses = (list) => {
    localStorage.setItem(KEYS.LICENSES, JSON.stringify(list));
  };

  /* ---- Gabungan semua lisensi ---- */
  const getLicenses = () => [...BUILTIN_LICENSES, ...getStoredLicenses()];

  /* ---- Tambah lisensi baru (dipanggil admin) ---- */
  const addLicense = (code, name, note = '') => {
    const list = getStoredLicenses();
    list.push({ code, name, note, createdAt: new Date().toISOString() });
    saveStoredLicenses(list);
  };

  /* ---- Hapus lisensi (hanya yang dari localStorage) ---- */
  const removeLicense = (code) => {
    const list = getStoredLicenses().filter(l => l.code !== code);
    saveStoredLicenses(list);
  };

  /* ---- Session ---- */
  const getSession = () => {
    try { return JSON.parse(localStorage.getItem(KEYS.SESSION)); }
    catch { return null; }
  };
  const setSession = (data) => localStorage.setItem(KEYS.SESSION, JSON.stringify(data));
  const clearSession = () => localStorage.removeItem(KEYS.SESSION);

  /* ---- Attempt / Lock ---- */
  const getAttempts  = () => parseInt(localStorage.getItem(KEYS.ATTEMPTS) || '0');
  const setAttempts  = (n) => localStorage.setItem(KEYS.ATTEMPTS, n);
  const getLockUntil = () => parseInt(localStorage.getItem(KEYS.LOCK_UNTIL) || '0');
  const setLockUntil = (ts) => localStorage.setItem(KEYS.LOCK_UNTIL, ts);
  const clearLock    = () => {
    localStorage.removeItem(KEYS.ATTEMPTS);
    localStorage.removeItem(KEYS.LOCK_UNTIL);
  };

  const isLocked      = () => Date.now() < getLockUntil();
  const remainingLock = () => Math.ceil((getLockUntil() - Date.now()) / 1000);

  /* ---- Normalize kode ---- */
  const normalizeCode = (raw) => raw.trim().toUpperCase().replace(/\s+/g, '');

  /* ---- Login ---- */
  const login = (rawCode) => {
    if (isLocked()) return { ok: false, locked: true, seconds: remainingLock() };

    const code    = normalizeCode(rawCode);
    const license = getLicenses().find(l => normalizeCode(l.code) === code);

    if (license) {
      clearLock();
      setSession({ code: license.code, name: license.name, loginAt: Date.now() });
      return { ok: true, name: license.name };
    }

    const attempts = getAttempts() + 1;
    setAttempts(attempts);
    if (attempts >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_DURATION);
      setAttempts(0);
      return { ok: false, locked: true, seconds: LOCK_DURATION / 1000 };
    }
    return { ok: false, locked: false, remaining: MAX_ATTEMPTS - attempts };
  };

  const logout = () => { clearSession(); window.location.href = 'index.html'; };

  /* ---- Guards ---- */
  const requireAuth = () => {
    if (!getSession()) { window.location.href = 'index.html'; return false; }
    return true;
  };
  const requireGuest = () => {
    if (getSession()) { window.location.href = 'dashboard.html'; return false; }
    return true;
  };

  /* ---- Generate kode ---- */
  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `PVP-${seg(4)}-${seg(4)}`;
  };

  return {
    login, logout,
    requireAuth, requireGuest,
    getSession,
    isLocked, remainingLock,
    generateLicenseCode,
    getLicenses, addLicense, removeLicense
  };
})();

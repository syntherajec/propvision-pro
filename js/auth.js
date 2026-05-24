/* ============================================================
   PropVision Pro — Auth System (Lisensi Kode)
   
   Cara kerja:
   - Admin generate kode lisensi unik (contoh: PVP-X7K2-9QMR)
   - Kode disimpan di dalam file ini (VALID_LICENSES)
   - Pembeli input kode di halaman login
   - Kode valid → langsung masuk, nama tersimpan di browser mereka
   - Berfungsi di device manapun
   ============================================================ */

const Auth = (() => {

  /* ============================================================
     DAFTAR KODE LISENSI VALID
     Edit bagian ini untuk tambah / hapus lisensi pembeli.
     Format: { code: 'KODE', name: 'Nama Pembeli', note: 'Catatan' }
     ============================================================ */
  const VALID_LICENSES = [
    { code: 'PVP-DEMO-2026', name: 'Demo User',    note: 'Akun demo' },
    // Tambahkan kode lisensi pembeli di sini:
    // { code: 'PVP-XXXX-XXXX', name: 'Nama Pembeli', note: 'Catatan' },
  ];

  const KEYS = {
    SESSION:    'pvp_session',
    ATTEMPTS:   'pvp_attempts',
    LOCK_UNTIL: 'pvp_lock_until'
  };

  const MAX_ATTEMPTS  = 5;
  const LOCK_DURATION = 60 * 1000; // 60 detik

  /* ---- Session ---- */
  const getSession = () => {
    try { return JSON.parse(localStorage.getItem(KEYS.SESSION)); }
    catch { return null; }
  };

  const setSession = (data) => {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(data));
  };

  const clearSession = () => {
    localStorage.removeItem(KEYS.SESSION);
  };

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

  /* ---- Normalize kode: uppercase, strip spasi ---- */
  const normalizeCode = (raw) => raw.trim().toUpperCase().replace(/\s+/g, '');

  /* ---- Login dengan kode lisensi ---- */
  const login = (rawCode) => {
    if (isLocked()) {
      return { ok: false, locked: true, seconds: remainingLock() };
    }

    const code    = normalizeCode(rawCode);
    const license = VALID_LICENSES.find(l => normalizeCode(l.code) === code);

    if (license) {
      clearLock();
      setSession({
        code:    license.code,
        name:    license.name,
        loginAt: Date.now()
      });
      return { ok: true, name: license.name };
    }

    // Salah kode
    const attempts = getAttempts() + 1;
    setAttempts(attempts);
    if (attempts >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCK_DURATION);
      setAttempts(0);
      return { ok: false, locked: true, seconds: LOCK_DURATION / 1000 };
    }
    return { ok: false, locked: false, remaining: MAX_ATTEMPTS - attempts };
  };

  const logout = () => {
    clearSession();
    window.location.href = 'index.html';
  };

  /* ---- Guards ---- */
  const requireAuth = () => {
    if (!getSession()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  };

  const requireGuest = () => {
    if (getSession()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  };

  /* ---- Generate kode lisensi baru (dipakai admin.js) ---- */
  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `PVP-${seg(4)}-${seg(4)}`;
  };

  /* ---- Expose VALID_LICENSES untuk admin panel ---- */
  const getLicenses = () => VALID_LICENSES;

  return {
    login, logout,
    requireAuth, requireGuest,
    getSession,
    isLocked, remainingLock,
    generateLicenseCode, getLicenses
  };
})();

/* ============================================================
   PropVision Pro — Admin Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_PASS = 'adminazka2026';
  const gate  = document.getElementById('admin-gate');
  const panel = document.getElementById('admin-panel');

  if (!gate || !panel) return;

  /* ---- Gate ---- */
  const passInput = document.getElementById('admin-pass-input');
  const passBtn   = document.getElementById('admin-pass-btn');
  const passErr   = document.getElementById('admin-pass-error');

  const tryUnlock = () => {
    const val = passInput.value;
    if (val === ADMIN_PASS) {
      gate.classList.add('hidden');
      panel.classList.remove('hidden');
      renderPanel();
    } else {
      passInput.classList.add('error');
      if (passErr) { passErr.textContent = 'Password salah. Coba lagi.'; passErr.classList.add('show'); }
      passInput.value = '';
      passInput.focus();
      setTimeout(() => { passInput.classList.remove('error'); }, 1200);
    }
  };

  passBtn?.addEventListener('click', tryUnlock);
  passInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });

  // Toggle password visibility
  const toggleBtn = document.getElementById('toggle-admin-pass');
  toggleBtn?.addEventListener('click', () => {
    const type = passInput.type === 'password' ? 'text' : 'password';
    passInput.type = type;
    toggleBtn.innerHTML = type === 'password'
      ? '<i class="ti ti-eye"></i>'
      : '<i class="ti ti-eye-off"></i>';
  });

  /* ---- Admin logout ---- */
  document.getElementById('admin-logout')?.addEventListener('click', () => {
    gate.classList.remove('hidden');
    panel.classList.add('hidden');
    passInput.value = '';
  });

  /* ---- Render panel ---- */
  function renderPanel() {
    renderStats();
    renderLicenseTable();
    initGenerateForm();
  }

  function renderStats() {
    const licenses = Auth.getLicenses();
    const el = document.getElementById('total-users');
    if (el) el.textContent = licenses.length;
  }

  /* ---- License Table ---- */
  function renderLicenseTable() {
    const tbody = document.getElementById('license-tbody');
    const empty = document.getElementById('user-empty');
    if (!tbody) return;

    const licenses = Auth.getLicenses();
    tbody.innerHTML = '';

    if (licenses.length === 0) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    licenses.forEach((lic, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:500">${escHtml(lic.name)}</td>
        <td style="font-family:'Courier New',monospace;font-size:12px">${escHtml(lic.code)}</td>
        <td style="font-size:12px;color:var(--text-muted)">${escHtml(lic.note || '-')}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="copy-btn-sm" data-copy-idx="${idx}" title="Salin kredensial">
              <i class="ti ti-copy"></i> Salin
            </button>
          </div>
        </td>`;
      tbody.appendChild(tr);

      // Copy credentials
      tr.querySelector(`[data-copy-idx="${idx}"]`)?.addEventListener('click', () => {
        const text = `PropVision Pro — Akses Login\nNama: ${lic.name}\nKode Lisensi: ${lic.code}\nURL: ${window.location.origin}/index.html`;
        navigator.clipboard.writeText(text).then(() => {
          showAdminToast('Kredensial berhasil disalin', 'success');
        }).catch(() => {
          const el = document.createElement('textarea');
          el.value = text;
          el.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          showAdminToast('Kredensial berhasil disalin', 'success');
        });
      });
    });
  }

  /* ---- Generate License Form ---- */
  function initGenerateForm() {
    const form    = document.getElementById('add-user-form');
    const nameIn  = document.getElementById('new-user-name');
    const nameErr = document.getElementById('name-error');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameIn?.value.trim();
      const noteEl = document.getElementById('new-user-note');
      const note = noteEl ? noteEl.value.trim() : '';

      if (!name || name.length < 2) {
        if (nameErr) { nameErr.textContent = 'Nama minimal 2 karakter'; nameErr.classList.add('show'); }
        nameIn?.classList.add('error');
        return;
      }
      if (nameErr) nameErr.classList.remove('show');
      nameIn?.classList.remove('error');

      const code   = Auth.generateLicenseCode();
      const waMsg  = `Halo ${name}! 👋\n\nBerikut kode akses PropVision Pro Anda:\n\n🔑 *${code}*\n\nCara masuk:\n1. Buka link berikut: ${window.location.origin}/index.html\n2. Masukkan kode di atas\n3. Klik "Masuk ke Platform"\n\nSelamat menggunakan PropVision Pro! 🏠`;
      const snippet = `{ code: '${code}', name: '${name}', note: '${note || 'Pembeli'}' },`;

      // Show result card
      const resultEl = document.getElementById('new-user-result');
      if (resultEl) {
        resultEl.classList.remove('hidden');
        const codeEl = document.getElementById('result-code');
        const rNameEl = document.getElementById('result-name');
        if (codeEl)  codeEl.textContent  = code;
        if (rNameEl) rNameEl.textContent = name;

        // Show snippet to add to auth.js
        const snippetEl = document.getElementById('result-snippet');
        if (snippetEl) snippetEl.textContent = snippet;

        // Copy WA message
        document.getElementById('copy-new-creds')?.addEventListener('click', () => {
          navigator.clipboard.writeText(waMsg)
            .then(() => showAdminToast('Pesan WA berhasil disalin!', 'success'))
            .catch(() => {});
        }, { once: true });

        // Copy snippet
        document.getElementById('copy-snippet')?.addEventListener('click', () => {
          navigator.clipboard.writeText(snippet)
            .then(() => showAdminToast('Snippet disalin! Tempel ke auth.js', 'gold'))
            .catch(() => {});
        }, { once: true });
      }

      nameIn.value = '';
      if (noteEl) noteEl.value = '';
      renderStats();
      showAdminToast(`Kode lisensi untuk "${name}" berhasil dibuat`, 'success');
    });

    // Close result card
    document.getElementById('close-result')?.addEventListener('click', () => {
      document.getElementById('new-user-result')?.classList.add('hidden');
    });
  }

  /* ---- Toast ---- */
  function showAdminToast(message, type = 'gold') {
    let container = document.getElementById('admin-toast');
    if (!container) {
      container = document.createElement('div');
      container.id = 'admin-toast';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: 'ti-check', gold: 'ti-star', danger: 'ti-alert-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="ti ${icons[type] || 'ti-check'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 250); }, 3500);
  }

  /* ---- Utility ---- */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
});

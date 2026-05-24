/* ============================================================
   PropVision Pro — History Manager
   ============================================================ */

const HistoryManager = (() => {
  const MAX_HISTORY = 50;

  const getKey = () => {
    const session = Auth.getSession();
    return session ? `pvp_history_${session.code}` : null;
  };

  const getAll = () => {
    const key = getKey();
    if (!key) return [];
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  };

  const save = (item) => {
    const key = getKey();
    if (!key) return;
    const history = getAll();
    history.unshift({
      id: Date.now().toString(),
      ...item,
      savedAt: new Date().toISOString()
    });
    // Keep only last MAX_HISTORY
    if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
    localStorage.setItem(key, JSON.stringify(history));
  };

  const remove = (id) => {
    const key = getKey();
    if (!key) return;
    const history = getAll().filter(h => h.id !== id);
    localStorage.setItem(key, JSON.stringify(history));
  };

  const clearAll = () => {
    const key = getKey();
    if (!key) return;
    localStorage.removeItem(key);
  };

  const getById = (id) => getAll().find(h => h.id === id) || null;

  const formatDate = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return '-'; }
  };

  const TYPE_LABELS = {
    harga:   { label: 'Analisa Kewajaran Harga',    icon: 'ti-chart-bar' },
    roi:     { label: 'Proyeksi ROI & Investasi',   icon: 'ti-trending-up' },
    closing: { label: 'Profil Buyer & Skrip Closing',icon: 'ti-users' },
    risiko:  { label: 'Analisa Risiko & Keunggulan',icon: 'ti-shield-check' },
    laporan: { label: 'Laporan Konsultasi Lengkap', icon: 'ti-file-description' }
  };

  /* ---- Render history list ---- */
  const renderList = (containerId, onItemClick) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const history = getAll();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="history-empty">
          <i class="ti ti-clock-off"></i>
          <h3>Belum Ada Riwayat</h3>
          <p>Riwayat analisa akan muncul di sini setelah Anda menggunakan fitur analisa.</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="history-list">${history.map(h => {
      const meta = TYPE_LABELS[h.type] || { label: h.type, icon: 'ti-file' };
      return `
        <div class="history-item" data-id="${h.id}">
          <div class="history-icon"><i class="ti ${meta.icon}"></i></div>
          <div style="flex:1;min-width:0">
            <div class="history-type">${meta.label}</div>
            <div class="history-loc">${h.location || '-'}</div>
            <div class="history-date"><i class="ti ti-clock"></i>${formatDate(h.savedAt)}</div>
          </div>
          <div class="history-arrow"><i class="ti ti-chevron-right"></i></div>
          <button class="history-del" data-del-id="${h.id}" title="Hapus">
            <i class="ti ti-trash"></i>
          </button>
        </div>`;
    }).join('')}</div>`;

    // Click item
    container.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.history-del')) return;
        const id = el.getAttribute('data-id');
        const item = getById(id);
        if (item && onItemClick) onItemClick(item);
      });
    });

    // Delete item
    container.querySelectorAll('.history-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        remove(id);
        renderList(containerId, onItemClick);
        ModalManager.showToast('Riwayat dihapus', 'gold', 'ti-trash');
      });
    });
  };

  return { save, remove, clearAll, getAll, getById, renderList, TYPE_LABELS, formatDate };
})();

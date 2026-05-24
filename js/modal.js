/* ============================================================
   PropVision Pro — Modal & API Settings Manager
   ============================================================ */

const ModalManager = (() => {
  const MAX_SLOTS = 4;

  /* ---- Toast notification ---- */
  const showToast = (message, type = 'gold', icon = 'ti-check') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="ti ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  };

  /* ---- Copy to clipboard ---- */
  const copyText = (text, label = 'Disalin') => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} berhasil disalin`, 'gold', 'ti-copy');
    }).catch(() => {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast(`${label} berhasil disalin`, 'gold', 'ti-copy');
    });
  };

  /* ---- Open / Close Modal ---- */
  const openModal = (id) => {
    const backdrop = document.getElementById(id);
    if (!backdrop) return;
    backdrop.classList.remove('hidden');
    backdrop.classList.remove('closing');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (id) => {
    const backdrop = document.getElementById(id);
    if (!backdrop) return;
    backdrop.classList.add('closing');
    setTimeout(() => {
      backdrop.classList.add('hidden');
      backdrop.classList.remove('closing');
      document.body.style.overflow = '';
    }, 200);
  };

  /* ---- Click outside to close ---- */
  const initBackdropClose = (modalId) => {
    const el = document.getElementById(modalId);
    if (!el) return;
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal(modalId);
    });
  };

  /* ---- Render API Key Slots ---- */
  const renderApiSlots = () => {
    const container = document.getElementById('api-key-slots');
    if (!container) return;
    const keys = ApiEngine.getApiKeys();
    container.innerHTML = '';

    for (let i = 0; i < keys.length; i++) {
      const val = keys[i] || '';
      const isActive = val.trim().length > 0;
      container.insertAdjacentHTML('beforeend', `
        <div class="api-slot" data-index="${i}">
          <div class="api-slot-num">${i + 1}</div>
          <input
            class="api-slot-input"
            type="password"
            placeholder="sk-or-v1-••••••••••••••••"
            value="${val}"
            data-key-index="${i}"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="api-slot-status ${isActive ? 'active' : ''}"></div>
          <button class="api-slot-del" data-del-key="${i}" title="Hapus">
            <i class="ti ti-x"></i>
          </button>
        </div>
      `);
    }

    // Update status dot live
    container.querySelectorAll('.api-slot-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const dot = e.target.closest('.api-slot').querySelector('.api-slot-status');
        dot.classList.toggle('active', e.target.value.trim().length > 0);
      });
    });

    // Delete slot
    container.querySelectorAll('[data-del-key]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-del-key'));
        const keys = ApiEngine.getApiKeys();
        keys.splice(idx, 1);
        ApiEngine.saveApiKeys(keys);
        renderApiSlots();
        updateAddKeyBtn();
      });
    });

    updateAddKeyBtn();
  };

  const updateAddKeyBtn = () => {
    const btn = document.getElementById('add-key-btn');
    if (btn) btn.disabled = ApiEngine.getApiKeys().length >= MAX_SLOTS;
  };

  /* ---- Render Model Slots ---- */
  const renderModelSlots = () => {
    const container = document.getElementById('model-slots');
    if (!container) return;
    const models = ApiEngine.getModels();
    container.innerHTML = '';

    for (let i = 0; i < models.length; i++) {
      const val = models[i] || '';
      const isActive = val.trim().length > 0;
      container.insertAdjacentHTML('beforeend', `
        <div class="api-slot" data-index="${i}">
          <div class="api-slot-num">${i + 1}</div>
          <input
            class="api-slot-input"
            type="text"
            placeholder="contoh: google/gemini-flash-1.5"
            value="${val}"
            data-model-index="${i}"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="api-slot-status ${isActive ? 'active' : ''}"></div>
          <button class="api-slot-del" data-del-model="${i}" title="Hapus">
            <i class="ti ti-x"></i>
          </button>
        </div>
      `);
    }

    container.querySelectorAll('.api-slot-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const dot = e.target.closest('.api-slot').querySelector('.api-slot-status');
        dot.classList.toggle('active', e.target.value.trim().length > 0);
      });
    });

    container.querySelectorAll('[data-del-model]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-del-model'));
        const models = ApiEngine.getModels();
        models.splice(idx, 1);
        ApiEngine.saveModels(models);
        renderModelSlots();
        updateAddModelBtn();
      });
    });

    updateAddModelBtn();
  };

  const updateAddModelBtn = () => {
    const btn = document.getElementById('add-model-btn');
    if (btn) btn.disabled = ApiEngine.getModels().length >= MAX_SLOTS;
  };

  /* ---- Save API Settings ---- */
  const saveApiSettings = () => {
    // Collect key values
    const keyInputs = document.querySelectorAll('[data-key-index]');
    const keys = Array.from(keyInputs).map(i => i.value.trim()).filter(v => v);
    ApiEngine.saveApiKeys(keys);

    // Collect model values
    const modelInputs = document.querySelectorAll('[data-model-index]');
    const models = Array.from(modelInputs).map(i => i.value.trim()).filter(v => v);
    ApiEngine.saveModels(models);

    closeModal('api-modal');
    showToast('Pengaturan API berhasil disimpan', 'success', 'ti-check');
  };

  /* ---- Init API Modal ---- */
  const initApiModal = () => {
    // Open triggers
    document.querySelectorAll('[data-open-api-modal]').forEach(el => {
      el.addEventListener('click', () => {
        renderApiSlots();
        renderModelSlots();
        openModal('api-modal');
      });
    });

    // Close triggers
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        closeModal(el.getAttribute('data-close-modal'));
      });
    });

    initBackdropClose('api-modal');

    // Add key button
    const addKeyBtn = document.getElementById('add-key-btn');
    if (addKeyBtn) {
      addKeyBtn.addEventListener('click', () => {
        const keys = ApiEngine.getApiKeys();
        if (keys.length >= MAX_SLOTS) return;
        keys.push('');
        ApiEngine.saveApiKeys(keys);
        renderApiSlots();
      });
    }

    // Add model button
    const addModelBtn = document.getElementById('add-model-btn');
    if (addModelBtn) {
      addModelBtn.addEventListener('click', () => {
        const models = ApiEngine.getModels();
        if (models.length >= MAX_SLOTS) return;
        models.push('');
        ApiEngine.saveModels(models);
        renderModelSlots();
      });
    }

    // Save button
    const saveBtn = document.getElementById('save-api-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveApiSettings);
    }
  };

  return {
    showToast, copyText,
    openModal, closeModal,
    initApiModal, renderApiSlots, renderModelSlots
  };
})();

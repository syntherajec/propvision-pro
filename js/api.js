/* ============================================================
   PropVision Pro — API Engine
   Failover 4 API Keys + Race 4 Models (OpenRouter)
   ============================================================ */

const ApiEngine = (() => {
  const STORAGE_KEYS = {
    API_KEYS: 'pvp_api_keys',
    MODELS:   'pvp_models'
  };

  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const REQUEST_TIMEOUT = 30000; // 30 detik

  /* ---- Storage ---- */
  const getApiKeys = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.API_KEYS)) || []; }
    catch { return []; }
  };

  const getModels = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.MODELS)) || []; }
    catch { return []; }
  };

  const saveApiKeys = (keys) => {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
  };

  const saveModels = (models) => {
    localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
  };

  /* ---- Single request with timeout ---- */
  const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  /* ---- Single model call ---- */
  const callModel = async (apiKey, model, messages, systemPrompt) => {
    const payload = {
      model,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      max_tokens: 2000,
      temperature: 0.7
    };

    const res = await fetchWithTimeout(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PropVision Pro'
      },
      body: JSON.stringify(payload)
    }, REQUEST_TIMEOUT);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const status = res.status;
      // 429 = rate limit, 401 = unauthorized, 402 = payment required
      if ([429, 401, 402].includes(status)) {
        throw new Error(`LIMIT:${status}`);
      }
      throw new Error(`HTTP:${status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('EMPTY_RESPONSE');
    return content;
  };

  /* ---- Race: call all models simultaneously, return fastest ---- */
  const raceModels = async (apiKey, models, messages, systemPrompt) => {
    const activeModels = models.filter(m => m && m.trim());
    if (activeModels.length === 0) throw new Error('NO_MODELS');

    const racePromises = activeModels.map(model =>
      callModel(apiKey, model, messages, systemPrompt)
        .then(content => ({ content, model }))
    );

    // Promise.any — take first that resolves (not rejects)
    if (typeof Promise.any === 'function') {
      return await Promise.any(racePromises);
    }

    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      let settled = false;
      let rejections = 0;
      racePromises.forEach(p => {
        p.then(result => {
          if (!settled) { settled = true; resolve(result); }
        }).catch(() => {
          rejections++;
          if (rejections === racePromises.length && !settled) {
            reject(new Error('ALL_MODELS_FAILED'));
          }
        });
      });
    });
  };

  /* ---- Failover: try each API key in order ---- */
  const call = async (messages, systemPrompt = '') => {
    const apiKeys = getApiKeys().filter(k => k && k.trim());
    const models  = getModels().filter(m => m && m.trim());

    if (apiKeys.length === 0) {
      throw new Error('NO_API_KEYS');
    }
    if (models.length === 0) {
      throw new Error('NO_MODELS');
    }

    let lastError = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i].trim();
      try {
        const result = await raceModels(apiKey, models, messages, systemPrompt);
        return { ...result, keyIndex: i + 1 };
      } catch (err) {
        lastError = err;
        // If limit/auth error, try next key
        const msg = err.message || '';
        if (msg.startsWith('LIMIT:') || msg.startsWith('HTTP:')) {
          continue;
        }
        // No models or other non-key error — no point retrying other keys
        if (msg === 'NO_MODELS' || msg === 'ALL_MODELS_FAILED') {
          break;
        }
        // Network / timeout — try next key
        continue;
      }
    }

    // All keys failed
    const msg = lastError?.message || 'UNKNOWN';
    if (msg === 'EMPTY_RESPONSE') {
      throw new Error('Model tidak mengembalikan respons. Coba ganti model di Pengaturan API.');
    }
    if (msg === 'NO_MODELS' || msg === 'ALL_MODELS_FAILED') {
      throw new Error('Semua model gagal merespons. Periksa nama model di Pengaturan API.');
    }
    if (msg.includes('429') || msg.includes('402')) {
      throw new Error('Semua API key telah mencapai batas limit. Silakan tambah API key baru.');
    }
    if (msg.includes('401')) {
      throw new Error('API key tidak valid. Periksa kembali API key di Pengaturan.');
    }
    if (msg === 'NO_API_KEYS') {
      throw new Error('Belum ada API key. Masukkan API key di Pengaturan.');
    }
    throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
  };

  return {
    call,
    getApiKeys, getModels,
    saveApiKeys, saveModels
  };
})();

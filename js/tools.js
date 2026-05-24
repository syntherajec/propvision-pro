/* ============================================================
   PropVision Pro — Tools Logic
   5 Fitur: Harga, ROI, Closing, Risiko, Laporan Lengkap
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  ModalManager.initApiModal();
  initSidebar();
  initTabs();
  initAllForms();
  initHistoryInline();
});

/* ---- Sidebar & mobile ---- */
function initSidebar() {
  const session = Auth.getSession();
  const nameEl  = document.getElementById('sb-user-name');
  const initEl  = document.getElementById('sb-user-init');
  if (nameEl) nameEl.textContent = session.name;
  if (initEl) initEl.textContent = session.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  hamburger?.addEventListener('click', () => { sidebar?.classList.add('open'); overlay?.classList.add('show'); document.body.style.overflow='hidden'; });
  overlay?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); document.body.style.overflow=''; });
  document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', () => Auth.logout()));

  // Topbar date
  const tbDate = document.getElementById('tb-date');
  if (tbDate) tbDate.textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
}

/* ---- Tab switching ---- */
function initTabs() {
  const tabs   = document.querySelectorAll('.tool-tab');
  const panels = document.querySelectorAll('.tool-panel');

  // Activate from URL hash or default
  const hash = window.location.hash.replace('#', '') || 'harga';
  activateTab(hash);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      activateTab(target);
      window.location.hash = target;
    });
  });

  function activateTab(target) {
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === target));
    panels.forEach(p => p.classList.toggle('active', p.getAttribute('data-panel') === target));

    // Update topbar title
    const activeTab = document.querySelector(`.tool-tab[data-tab="${target}"]`);
    const tbTitle = document.getElementById('tb-title');
    if (tbTitle && activeTab) {
      tbTitle.textContent = activeTab.querySelector('span')?.textContent || 'Analisa';
    }
  }
}

/* ---- Shared: show loading / result ---- */
function showLoading(resultId) {
  const el = document.getElementById(resultId);
  if (!el) return;
  el.innerHTML = `
    <div class="result-loading">
      <div class="spinner"></div>
      <div class="result-loading-text">Sedang menganalisa...</div>
      <div class="result-loading-sub">Memproses data properti Anda</div>
    </div>`;
}

function showError(resultId, message) {
  const el = document.getElementById(resultId);
  if (!el) return;
  el.innerHTML = `
    <div style="padding:20px">
      <div class="alert alert-danger">
        <i class="ti ti-alert-circle"></i>
        <div><strong>Terjadi Kesalahan</strong><br>${message}</div>
      </div>
    </div>`;
}

function showEmpty(resultId) {
  const el = document.getElementById(resultId);
  if (!el) return;
  el.innerHTML = `
    <div class="result-empty">
      <div class="result-empty-icon"><i class="ti ti-search"></i></div>
      <div class="result-empty-title">Hasil Analisa</div>
      <div class="result-empty-sub">Isi form di sebelah kiri dan klik "Analisa Sekarang" untuk melihat hasil.</div>
    </div>`;
}

function setAnalyzeBtn(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<div class="spinner spinner-sm"></div> Menganalisa...`
    : `<i class="ti ti-sparkles"></i> Analisa Sekarang`;
}

function modelInfoBar(model, keyIndex) {
  return `
    <div class="model-info-bar">
      <div class="key-badge"><i class="ti ti-key"></i> API Key ${keyIndex}</div>
      <div class="model-badge"><i class="ti ti-cpu"></i> ${model}</div>
    </div>`;
}

function copyResultBtn(targetId) {
  return `<button class="btn btn-outline btn-sm" onclick="copyResult('${targetId}')"><i class="ti ti-copy"></i> Salin</button>`;
}

window.copyResult = (targetId) => {
  const el = document.getElementById(targetId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  ModalManager.copyText(text, 'Laporan');
};

/* ---- Parse AI response into clean sections ---- */
function parseSection(text, keyword) {
  // Try to find a section by keyword
  const lines = text.split('\n');
  let capturing = false;
  let result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase().includes(keyword.toLowerCase()) && (trimmed.startsWith('#') || trimmed.endsWith(':'))) {
      capturing = true;
      continue;
    }
    if (capturing && (trimmed.startsWith('#') || (trimmed.endsWith(':') && trimmed.length < 50))) {
      break;
    }
    if (capturing) result.push(trimmed.replace(/^[-*•]\s*/, ''));
  }
  return result.join('\n') || text.slice(0, 300);
}

function renderTextBlock(text) {
  // Convert bullet lines to list, otherwise paragraph
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const isList = lines.every(l => /^[-*•]/.test(l) || l.length < 120);
  if (isList && lines.length > 1) {
    return `<ul class="result-list">${lines.map(l => `<li>${l.replace(/^[-*•]\s*/, '')}</li>`).join('')}</ul>`;
  }
  return `<p class="result-section-content">${lines.join('<br>')}</p>`;
}

/* ============================================================
   FITUR 1 — ANALISA KEWAJARAN HARGA
   ============================================================ */
function initAllForms() {
  initHargaForm();
  initROIForm();
  initClosingForm();
  initRisikoForm();
  initLaporanForm();
}

function initHargaForm() {
  const form = document.getElementById('form-harga');
  if (!form) return;
  showEmpty('result-harga');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lokasi   = document.getElementById('h-lokasi').value.trim();
    const tipe     = document.getElementById('h-tipe').value.trim();
    const luas_t   = document.getElementById('h-luas-tanah').value.trim();
    const luas_b   = document.getElementById('h-luas-bangunan').value.trim();
    const harga    = document.getElementById('h-harga').value.trim();
    const kondisi  = document.getElementById('h-kondisi').value.trim();

    if (!lokasi || !tipe || !harga) {
      ModalManager.showToast('Lengkapi field yang wajib diisi', 'danger', 'ti-alert-circle');
      return;
    }

    setAnalyzeBtn('btn-harga', true);
    showLoading('result-harga');

    const prompt = `Kamu adalah konsultan properti senior berpengalaman 20 tahun di Indonesia.

Analisa kewajaran harga properti berikut:
- Lokasi: ${lokasi}
- Tipe: ${tipe}
- Luas Tanah: ${luas_t || 'tidak disebutkan'}
- Luas Bangunan: ${luas_b || 'tidak disebutkan'}
- Harga Listing: ${harga}
- Kondisi/Keterangan: ${kondisi || 'tidak ada keterangan tambahan'}

Berikan analisa LENGKAP dalam format berikut:

## VONIS HARGA
[Pilih salah satu: WAJAR / KEMAHALAN / HARGA MURAH] + penjelasan singkat 1-2 kalimat.

## ESTIMASI HARGA IDEAL
Berikan rentang harga wajar untuk properti ini berdasarkan area dan spesifikasinya.

## FAKTOR PENENTU HARGA
Buat daftar 4-6 faktor yang mempengaruhi harga properti ini (positif dan negatif).

## PERBANDINGAN PASAR
Jelaskan bagaimana harga ini dibandingkan dengan properti serupa di area tersebut.

## REKOMENDASI NEGOSIASI
Berikan saran negosiasi konkret: berapa persen bisa ditawar dan argumen apa yang bisa digunakan.

Tulis dalam Bahasa Indonesia yang profesional, jelas, dan bisa langsung digunakan agen properti.`;

    try {
      const { content, model, keyIndex } = await ApiEngine.call([{ role: 'user', content: prompt }]);
      renderHargaResult(content, model, keyIndex, { lokasi, tipe, harga });
    } catch (err) {
      showError('result-harga', err.message);
    } finally {
      setAnalyzeBtn('btn-harga', false);
    }
  });
}

function renderHargaResult(text, model, keyIndex, meta) {
  const container = document.getElementById('result-harga');
  if (!container) return;

  // Extract verdict
  let verdictClass = 'verdict-ok', verdictIcon = 'ti-check', verdictText = 'Harga Wajar';
  const tUp = text.toUpperCase();
  // Deteksi verdict hanya dari baris pertama setelah heading VONIS HARGA
  // agar tidak false-positive dari kalimat lain yang mengandung kata "MURAH"
  const vonisMatch = tUp.match(/##\s*VONIS HARGA[\s\S]*?\n([^\n]+)/);
  const vonisLine = vonisMatch ? vonisMatch[1] : tUp.slice(0, 200);
  if (vonisLine.includes('KEMAHALAN') || vonisLine.includes('TERLALU MAHAL')) {
    verdictClass = 'verdict-warn'; verdictIcon = 'ti-alert-triangle'; verdictText = 'Kemahalan';
  } else if (vonisLine.includes('HARGA MURAH') || vonisLine.includes('MURAH')) {
    verdictClass = 'verdict-danger'; verdictIcon = 'ti-trending-down'; verdictText = 'Harga Murah';
  }

  const sections = [
    { key: 'estimasi harga ideal', label: 'ESTIMASI HARGA IDEAL' },
    { key: 'faktor penentu', label: 'FAKTOR PENENTU HARGA' },
    { key: 'perbandingan pasar', label: 'PERBANDINGAN PASAR' },
    { key: 'rekomendasi negosiasi', label: 'REKOMENDASI NEGOSIASI' }
  ];

  const sectionsHtml = sections.map(s => {
    const content = parseSection(text, s.key);
    return `
      <div class="result-section">
        <div class="result-section-label">${s.label}</div>
        ${renderTextBlock(content)}
      </div>`;
  }).join('');

  container.innerHTML = `
    <div id="harga-output">
      <div class="result-section">
        <div class="result-section-label">VONIS HARGA</div>
        <div class="verdict ${verdictClass}"><i class="ti ${verdictIcon}"></i>${verdictText}</div>
        <div class="result-section-content" style="margin-top:6px">${parseSection(text,'vonis harga') || ''}</div>
      </div>
      ${sectionsHtml}
      ${modelInfoBar(model, keyIndex)}
    </div>`;

  HistoryManager.save({ type: 'harga', location: meta.lokasi, summary: verdictText, harga: meta.harga, result: text });
  ModalManager.showToast('Analisa selesai', 'success', 'ti-check');

  // Update copy btn
  const copyBtn = document.getElementById('copy-harga');
  if (copyBtn) copyBtn.onclick = () => ModalManager.copyText(document.getElementById('harga-output').innerText, 'Laporan');
}

/* ============================================================
   FITUR 2 — PROYEKSI ROI
   ============================================================ */
function initROIForm() {
  const form = document.getElementById('form-roi');
  if (!form) return;
  showEmpty('result-roi');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lokasi  = document.getElementById('r-lokasi').value.trim();
    const tipe    = document.getElementById('r-tipe').value.trim();
    const harga   = document.getElementById('r-harga').value.trim();
    const sewa    = document.getElementById('r-sewa').value.trim();
    const tujuan  = document.getElementById('r-tujuan').value;

    if (!lokasi || !tipe || !harga) {
      ModalManager.showToast('Lengkapi field yang wajib diisi', 'danger', 'ti-alert-circle');
      return;
    }

    setAnalyzeBtn('btn-roi', true);
    showLoading('result-roi');

    const prompt = `Kamu adalah analis investasi properti senior di Indonesia.

Buat proyeksi ROI lengkap untuk properti berikut:
- Lokasi: ${lokasi}
- Tipe Properti: ${tipe}
- Harga Beli: ${harga}
- Estimasi Sewa/Bulan: ${sewa || 'tidak disebutkan'}
- Tujuan Investasi: ${tujuan}

Berikan analisa dalam format berikut:

## RINGKASAN INVESTASI
Nilai investasi, potensi keuntungan, dan kesimpulan singkat layak/tidak layak.

## PROYEKSI KENAIKAN NILAI
Estimasi nilai properti dalam 1 tahun, 3 tahun, dan 5 tahun ke depan (dalam Rupiah dan persentase). Berikan estimasi berdasarkan tren umum properti Indonesia dan karakteristik area tersebut.

## POTENSI YIELD SEWA
Estimasi pendapatan sewa tahunan, gross yield (%), dan net yield (%) setelah biaya perawatan.

## BREAK EVEN POINT
Berapa lama waktu yang dibutuhkan untuk balik modal dari investasi ini.

## ANALISA KELAYAKAN
Rating kelayakan investasi: SANGAT LAYAK / LAYAK / CUKUP LAYAK / KURANG LAYAK + alasan.

## FAKTOR RISIKO INVESTASI
3-4 faktor risiko yang perlu diperhatikan investor.

Gunakan angka konkret dalam Rupiah Indonesia. Tulis profesional dalam Bahasa Indonesia.`;

    try {
      const { content, model, keyIndex } = await ApiEngine.call([{ role: 'user', content: prompt }]);
      renderROIResult(content, model, keyIndex, { lokasi, tipe, harga });
    } catch (err) {
      showError('result-roi', err.message);
    } finally {
      setAnalyzeBtn('btn-roi', false);
    }
  });
}

function renderROIResult(text, model, keyIndex, meta) {
  const container = document.getElementById('result-roi');
  if (!container) return;

  const sections = [
    { key: 'ringkasan investasi', label: 'RINGKASAN INVESTASI' },
    { key: 'proyeksi kenaikan nilai', label: 'PROYEKSI KENAIKAN NILAI' },
    { key: 'potensi yield sewa', label: 'POTENSI YIELD SEWA' },
    { key: 'break even', label: 'BREAK EVEN POINT' },
    { key: 'analisa kelayakan', label: 'ANALISA KELAYAKAN' },
    { key: 'faktor risiko', label: 'FAKTOR RISIKO' }
  ];

  const sectionsHtml = sections.map(s => `
    <div class="result-section">
      <div class="result-section-label">${s.label}</div>
      ${renderTextBlock(parseSection(text, s.key))}
    </div>`).join('');

  container.innerHTML = `
    <div id="roi-output">
      ${sectionsHtml}
      ${modelInfoBar(model, keyIndex)}
    </div>`;

  HistoryManager.save({ type: 'roi', location: meta.lokasi, harga: meta.harga, result: text });
  ModalManager.showToast('Proyeksi ROI selesai', 'success', 'ti-check');

  const copyBtn = document.getElementById('copy-roi');
  if (copyBtn) copyBtn.onclick = () => ModalManager.copyText(document.getElementById('roi-output').innerText, 'Laporan ROI');
}

/* ============================================================
   FITUR 3 — PROFIL BUYER & SKRIP CLOSING
   ============================================================ */
function initClosingForm() {
  const form = document.getElementById('form-closing');
  if (!form) return;
  showEmpty('result-closing');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lokasi  = document.getElementById('c-lokasi').value.trim();
    const tipe    = document.getElementById('c-tipe').value.trim();
    const harga   = document.getElementById('c-harga').value.trim();
    const fitur   = document.getElementById('c-fitur').value.trim();
    const target  = document.getElementById('c-target').value.trim();

    if (!lokasi || !tipe || !harga) {
      ModalManager.showToast('Lengkapi field yang wajib diisi', 'danger', 'ti-alert-circle');
      return;
    }

    setAnalyzeBtn('btn-closing', true);
    showLoading('result-closing');

    const prompt = `Kamu adalah trainer properti senior dan pakar closing deal di Indonesia.

Buat strategi closing untuk properti berikut:
- Lokasi: ${lokasi}
- Tipe: ${tipe}
- Harga: ${harga}
- Keunggulan/Fitur: ${fitur || 'tidak disebutkan'}
- Target Pembeli Utama: ${target || 'belum ditentukan'}

Berikan dalam format berikut:

## PROFIL BUYER IDEAL
Deskripsikan 2-3 tipe pembeli yang paling cocok untuk properti ini (demografi, motivasi, kemampuan finansial).

## SKRIP CLOSING — INVESTOR
Skrip percakapan lengkap (3-5 kalimat pembuka yang kuat) untuk meyakinkan investor tentang potensi properti ini.

## SKRIP CLOSING — END USER / KELUARGA
Skrip percakapan lengkap untuk meyakinkan pembeli yang akan tinggal sendiri atau untuk keluarga.

## SKRIP CLOSING — PEMBELI RAGU
Skrip khusus mengatasi keberatan/penolakan umum dan cara mengatasinya.

## KALIMAT FOLLOW-UP WHATSAPP
3 template pesan WhatsApp untuk follow-up prospek yang belum memutuskan.

Gunakan Bahasa Indonesia yang natural, persuasif, dan profesional. Buat skrip yang realistis dan bisa langsung digunakan.`;

    try {
      const { content, model, keyIndex } = await ApiEngine.call([{ role: 'user', content: prompt }]);
      renderClosingResult(content, model, keyIndex, { lokasi, tipe, harga });
    } catch (err) {
      showError('result-closing', err.message);
    } finally {
      setAnalyzeBtn('btn-closing', false);
    }
  });
}

function renderClosingResult(text, model, keyIndex, meta) {
  const container = document.getElementById('result-closing');
  if (!container) return;

  const scripts = [
    { key: 'skrip closing — investor', label: 'INVESTOR', color: '#C9A84C' },
    { key: 'skrip closing — end user', label: 'END USER / KELUARGA', color: '#1570EF' },
    { key: 'skrip closing — pembeli ragu', label: 'MENGATASI KEBERATAN', color: '#12B76A' }
  ];

  const scriptsHtml = scripts.map(s => `
    <div class="script-block">
      <div class="script-label" style="color:${s.color}">${s.label}</div>
      <div class="script-text">${parseSection(text, s.key).replace(/\n/g, '<br>')}</div>
    </div>`).join('');

  container.innerHTML = `
    <div id="closing-output">
      <div class="result-section">
        <div class="result-section-label">PROFIL BUYER IDEAL</div>
        ${renderTextBlock(parseSection(text, 'profil buyer'))}
      </div>
      <div class="result-section">
        <div class="result-section-label">SKRIP CLOSING</div>
        ${scriptsHtml}
      </div>
      <div class="result-section">
        <div class="result-section-label">FOLLOW-UP WHATSAPP</div>
        ${renderTextBlock(parseSection(text, 'follow-up whatsapp'))}
      </div>
      ${modelInfoBar(model, keyIndex)}
    </div>`;

  HistoryManager.save({ type: 'closing', location: meta.lokasi, harga: meta.harga, result: text });
  ModalManager.showToast('Skrip closing siap', 'success', 'ti-check');

  const copyBtn = document.getElementById('copy-closing');
  if (copyBtn) copyBtn.onclick = () => ModalManager.copyText(document.getElementById('closing-output').innerText, 'Skrip Closing');
}

/* ============================================================
   FITUR 4 — ANALISA RISIKO & KEUNGGULAN
   ============================================================ */
function initRisikoForm() {
  const form = document.getElementById('form-risiko');
  if (!form) return;
  showEmpty('result-risiko');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lokasi   = document.getElementById('rk-lokasi').value.trim();
    const tipe     = document.getElementById('rk-tipe').value.trim();
    const harga    = document.getElementById('rk-harga').value.trim();
    const kondisi  = document.getElementById('rk-kondisi').value.trim();
    const sekitar  = document.getElementById('rk-sekitar').value.trim();

    if (!lokasi || !tipe || !harga) {
      ModalManager.showToast('Lengkapi field yang wajib diisi', 'danger', 'ti-alert-circle');
      return;
    }

    setAnalyzeBtn('btn-risiko', true);
    showLoading('result-risiko');

    const prompt = `Kamu adalah auditor properti dan konsultan due diligence berpengalaman di Indonesia.

Lakukan analisa risiko dan keunggulan untuk properti berikut:
- Lokasi: ${lokasi}
- Tipe: ${tipe}
- Harga: ${harga}
- Kondisi Properti: ${kondisi || 'tidak disebutkan'}
- Kondisi Sekitar: ${sekitar || 'tidak disebutkan'}

Berikan analisa dalam format berikut:

## KEUNGGULAN UTAMA
4-6 poin keunggulan terkuat properti ini yang bisa dijadikan argumen penjualan.

## RED FLAG / RISIKO
4-6 poin risiko atau kelemahan yang harus diantisipasi sebelum dan saat presentasi ke klien.

## SKOR KELAYAKAN
Berikan skor dari 10 untuk: Lokasi, Harga, Kondisi, Potensi Investasi. Tambahkan skor total dan interpretasinya.

## STRATEGI MITIGASI
Untuk setiap red flag, berikan cara mengatasinya atau argumen balik yang bisa digunakan agen.

## REKOMENDASI FINAL
Apakah properti ini direkomendasikan untuk dijual aktif? Jelaskan singkat.

Tulis profesional dan konkret dalam Bahasa Indonesia.`;

    try {
      const { content, model, keyIndex } = await ApiEngine.call([{ role: 'user', content: prompt }]);
      renderRisikoResult(content, model, keyIndex, { lokasi, tipe, harga });
    } catch (err) {
      showError('result-risiko', err.message);
    } finally {
      setAnalyzeBtn('btn-risiko', false);
    }
  });
}

function renderRisikoResult(text, model, keyIndex, meta) {
  const container = document.getElementById('result-risiko');
  if (!container) return;

  const sections = [
    { key: 'keunggulan utama', label: 'KEUNGGULAN UTAMA', listClass: 'success' },
    { key: 'red flag', label: 'RED FLAG & RISIKO', listClass: 'danger' },
    { key: 'skor kelayakan', label: 'SKOR KELAYAKAN', listClass: '' },
    { key: 'strategi mitigasi', label: 'STRATEGI MITIGASI', listClass: '' },
    { key: 'rekomendasi final', label: 'REKOMENDASI FINAL', listClass: '' }
  ];

  const sectionsHtml = sections.map(s => {
    const content = parseSection(text, s.key);
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    const listHtml = lines.length > 1
      ? `<ul class="result-list ${s.listClass}">${lines.map(l => `<li>${l.replace(/^[-*•]\s*/,'')}</li>`).join('')}</ul>`
      : `<p class="result-section-content">${content}</p>`;
    return `
      <div class="result-section">
        <div class="result-section-label">${s.label}</div>
        ${listHtml}
      </div>`;
  }).join('');

  container.innerHTML = `
    <div id="risiko-output">
      ${sectionsHtml}
      ${modelInfoBar(model, keyIndex)}
    </div>`;

  HistoryManager.save({ type: 'risiko', location: meta.lokasi, harga: meta.harga, result: text });
  ModalManager.showToast('Analisa risiko selesai', 'success', 'ti-check');

  const copyBtn = document.getElementById('copy-risiko');
  if (copyBtn) copyBtn.onclick = () => ModalManager.copyText(document.getElementById('risiko-output').innerText, 'Analisa Risiko');
}

/* ============================================================
   FITUR 5 — LAPORAN KONSULTASI LENGKAP
   ============================================================ */
function initLaporanForm() {
  const form = document.getElementById('form-laporan');
  if (!form) return;
  showEmpty('result-laporan');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lokasi   = document.getElementById('l-lokasi').value.trim();
    const tipe     = document.getElementById('l-tipe').value.trim();
    const luas_t   = document.getElementById('l-luas-tanah').value.trim();
    const luas_b   = document.getElementById('l-luas-bangunan').value.trim();
    const harga    = document.getElementById('l-harga').value.trim();
    const kondisi  = document.getElementById('l-kondisi').value.trim();
    const tujuan   = document.getElementById('l-tujuan').value;
    const klien    = document.getElementById('l-klien').value.trim();

    if (!lokasi || !tipe || !harga) {
      ModalManager.showToast('Lengkapi field yang wajib diisi', 'danger', 'ti-alert-circle');
      return;
    }

    setAnalyzeBtn('btn-laporan', true);
    showLoading('result-laporan');

    const prompt = `Kamu adalah konsultan properti senior dengan pengalaman 20 tahun di Indonesia. Buat laporan konsultasi properti LENGKAP dan PROFESIONAL yang bisa langsung ditunjukkan kepada klien.

Data Properti:
- Lokasi: ${lokasi}
- Tipe: ${tipe}
- Luas Tanah: ${luas_t || 'tidak disebutkan'}
- Luas Bangunan: ${luas_b || 'tidak disebutkan'}
- Harga Listing: ${harga}
- Kondisi: ${kondisi || 'tidak disebutkan'}
- Tujuan Klien: ${tujuan}
- Nama Klien: ${klien || 'Yth. Klien'}

Buat laporan LENGKAP dengan format berikut:

## 1. RINGKASAN EKSEKUTIF
Gambaran singkat dan kesimpulan utama tentang properti ini dalam 2-3 paragraf.

## 2. ANALISA KEWAJARAN HARGA
Vonis harga (wajar/kemahalan/murah), estimasi harga ideal, dan faktor-faktor yang mempengaruhi.

## 3. PROYEKSI NILAI & ROI
Estimasi nilai 1, 3, 5 tahun ke depan. Potensi yield sewa. Break even point.

## 4. PROFIL PEMBELI IDEAL
Siapa yang paling cocok membeli properti ini dan mengapa.

## 5. KEUNGGULAN PROPERTI
4-6 poin keunggulan terkuat.

## 6. RISIKO & MITIGASI
3-4 risiko utama beserta cara mengatasinya.

## 7. REKOMENDASI KONSULTAN
Rekomendasi konkret dan langkah selanjutnya yang disarankan.

Tulis dengan bahasa profesional yang sopan, lugas, dan meyakinkan. Gunakan angka Rupiah yang konkret. Ini adalah dokumen formal yang akan dibaca klien pebisnis.`;

    try {
      const { content, model, keyIndex } = await ApiEngine.call([{ role: 'user', content: prompt }]);
      renderLaporanResult(content, model, keyIndex, { lokasi, tipe, harga, klien, tujuan });
    } catch (err) {
      showError('result-laporan', err.message);
    } finally {
      setAnalyzeBtn('btn-laporan', false);
    }
  });
}

function renderLaporanResult(text, model, keyIndex, meta) {
  const container = document.getElementById('result-laporan');
  if (!container) return;

  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const sections = [
    '1. ringkasan eksekutif',
    '2. analisa kewajaran',
    '3. proyeksi',
    '4. profil pembeli',
    '5. keunggulan',
    '6. risiko',
    '7. rekomendasi'
  ];

  const sectionTitles = [
    'RINGKASAN EKSEKUTIF',
    'ANALISA KEWAJARAN HARGA',
    'PROYEKSI NILAI & ROI',
    'PROFIL PEMBELI IDEAL',
    'KEUNGGULAN PROPERTI',
    'RISIKO & MITIGASI',
    'REKOMENDASI KONSULTAN'
  ];

  const sectionsHtml = sections.map((key, i) => `
    <div class="report-section">
      <div class="report-section-title">
        <i class="ti ti-point-filled"></i>${sectionTitles[i]}
      </div>
      ${renderTextBlock(parseSection(text, key))}
    </div>`).join('');

  container.innerHTML = `
    <div class="full-report" id="laporan-output">
      <div class="report-header">
        <div class="report-header-logo">
          <div class="report-header-logo-icon"><i class="ti ti-building-skyscraper"></i></div>
          <div>
            <div class="report-header-logo-name">PropVision Pro</div>
            <div class="report-header-logo-tag">PROPERTY INTELLIGENCE</div>
          </div>
        </div>
        <div class="report-title">Laporan Konsultasi Properti</div>
        <div class="report-subtitle">Dokumen ini disiapkan secara khusus berdasarkan data properti yang diberikan</div>
        <div class="report-meta">
          <div class="report-meta-item"><label>LOKASI</label><span>${meta.lokasi}</span></div>
          <div class="report-meta-item"><label>HARGA</label><span>${meta.harga}</span></div>
          <div class="report-meta-item"><label>TUJUAN</label><span>${meta.tujuan}</span></div>
          <div class="report-meta-item"><label>TANGGAL</label><span>${now}</span></div>
        </div>
      </div>
      <div class="report-body">
        ${sectionsHtml}
      </div>
    </div>
    ${modelInfoBar(model, keyIndex)}`;

  HistoryManager.save({ type: 'laporan', location: meta.lokasi, harga: meta.harga, result: text });
  ModalManager.showToast('Laporan lengkap berhasil dibuat', 'success', 'ti-check');

  const copyBtn = document.getElementById('copy-laporan');
  if (copyBtn) copyBtn.onclick = () => ModalManager.copyText(document.getElementById('laporan-output').innerText, 'Laporan Lengkap');
}

/* ---- Inline history on history page ---- */
function initHistoryInline() {
  if (!window.location.pathname.includes('history.html')) return;
  const historyContainer = document.getElementById('history-container');
  if (!historyContainer) return;

  const renderHistory = () => {
    HistoryManager.renderList('history-container', (item) => {
      openHistoryDetail(item);
    });
  };

  renderHistory();

  // Clear all button
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Hapus semua riwayat analisa?')) {
        HistoryManager.clearAll();
        renderHistory();
        ModalManager.showToast('Semua riwayat dihapus', 'gold', 'ti-trash');
      }
    });
  }
}

function openHistoryDetail(item) {
  const modal = document.getElementById('history-modal');
  if (!modal) return;

  const meta = HistoryManager.TYPE_LABELS[item.type] || { label: item.type };
  document.getElementById('history-modal-title').textContent = meta.label;

  const detailContainer = document.getElementById('history-detail-content');
  if (detailContainer) {
    detailContainer.innerHTML = `
      <div class="history-detail-meta">
        <span class="badge badge-gold">${item.location || '-'}</span>
        <span class="badge badge-navy">${item.harga || ''}</span>
        <span class="badge badge-info">${HistoryManager.formatDate(item.savedAt)}</span>
      </div>
      <div class="history-detail-result">
        ${renderTextBlock(item.result || 'Tidak ada data')}
      </div>`;
  }

  ModalManager.openModal('history-modal');
}

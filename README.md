# PropVision Pro — Property Intelligence Platform

Platform analisa properti profesional berbasis AI untuk agen properti Indonesia.

---

## 🚀 Cara Deploy ke GitHub Pages

### Langkah 1 — Upload ke GitHub
1. Buat repository baru di [github.com](https://github.com) (Public)
2. Nama repository bebas, contoh: `propvision-pro`
3. Upload semua file dan folder ini ke repository

### Langkah 2 — Aktifkan GitHub Pages
1. Buka repository → **Settings**
2. Scroll ke bawah → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** → Folder: **/ (root)**
5. Klik **Save**

### Langkah 3 — Akses URL
Setelah 1-2 menit, website aktif di:
```
https://[username].github.io/[nama-repo]/
```

---

## 🔐 Akses Admin

URL admin: `https://[url-anda]/admin.html`  
Password admin: `adminazka2026`

---

## 📋 Struktur File

```
PropVision-Pro/
├── index.html          ← Halaman Login
├── admin.html          ← Panel Admin
├── dashboard.html      ← Dashboard Utama
├── tools.html          ← 5 Fitur Analisa
├── history.html        ← Riwayat Analisa
├── css/
│   ├── style.css
│   ├── auth.css
│   ├── dashboard.css
│   └── tools.css
├── js/
│   ├── auth.js
│   ├── api.js
│   ├── modal.js
│   ├── history.js
│   ├── dashboard.js
│   ├── tools.js
│   └── admin.js
└── assets/
    └── logo.svg
```

---

## ⚙️ Pengaturan API untuk Pembeli

Setelah login, pembeli klik ikon **kunci (🔑)** di pojok kanan atas untuk masukkan:
- **API Key OpenRouter** (dapatkan di openrouter.ai)
- **Nama Model** yang ingin digunakan

**Contoh model gratis OpenRouter:**
- `google/gemini-flash-1.5`
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `qwen/qwen-2-7b-instruct:free`

---

## 🛠️ Teknologi

- HTML5 + CSS3 + Vanilla JavaScript
- 100% berjalan di browser, tanpa server
- Data tersimpan di localStorage browser
- API: OpenRouter (openrouter.ai)

---

&copy; 2026 PropVision Pro. All rights reserved.

# 🐱 Meow Lebaran 1446 H

App ucapan Idul Fitri bertema kucing — AI Generator (GLM-4-Flash/Z.ai) + komentar publik + Dana Kaget.

## Stack
- **Runtime**: Node.js (Express)
- **Database**: PostgreSQL (via `pg`)
- **AI**: GLM-4-Flash via Z.ai → Fallback ke Google Gemini → Fallback ke Sumopod API
- **Frontend**: Vanilla HTML/CSS/JS (no build step)

---

## 🚀 Cara Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env, isi semua variabel
```

### 3. Isi .env
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/meow_lebaran
GLM_API_KEY=your_key_dari_bigmodel.cn
GEMINI_API_KEY=your_gemini_api_key_here
SUMOPOD_API_KEY=your_sumopod_api_key_here
DANA_KAGET_URL=https://link.dana.id/kaget?c=your_code_here
SITE_OWNER=Nama Kamu
```

### 4. Buat database PostgreSQL
```bash
# Dengan psql
psql -U postgres -c "CREATE DATABASE meow_lebaran;"

# Jika database baru:
node src/db-init.js

# Jika database sudah ada (untuk update schema dengan kolom avatar & likes):
node src/migrate-avatar.js
```

### 5. Jalankan server
```bash
# Production (dengan Express server)
npm start

# Development (auto-reload)
npm run dev
```

### 6. Build untuk Static Deployment (Opsional)
```bash
# Build static files untuk hosting seperti Vercel, Netlify, GitHub Pages
npm run build
```

Buka: http://localhost:3000 (untuk server) atau deploy folder `dist/` untuk static hosting

---

## 📁 Struktur

```
meow-lebaran/
├── public/
│   └── index.html        # Frontend lengkap (HTML + CSS + JS)
├── src/
│   ├── server.js         # Express server + semua route API
│   ├── db.js             # PostgreSQL pool
│   ├── ai.js             # GLM-4-Flash wrapper + fallback chain
│   ├── db-init.js        # Database schema creator
│   └── migrate-avatar.js # Migration script untuk update schema
├── .env.example
└── package.json
```

---

## 🔌 API Endpoints

| Method | URL | Deskripsi |
|--------|-----|-----------|
| `GET`  | `/api/ucapan?nama=X&gaya=lucu` | Generate ucapan AI |
| `GET`  | `/api/dana-kaget` | Dapatkan URL Dana Kaget dari environment |
| `GET`  | `/api/komentar` | Ambil semua komentar |
| `POST` | `/api/komentar` | Kirim komentar baru |

**gaya**: `lucu` \| `formal` \| `puisi`

**POST body**:
```json
{ "nama": "Budi", "pesan": "Selamat Lebaran!", "whatsapp": "081234567890" }
```

---

## 🔑 AI API Keys (Dengan Fallback Chain)

Sistem ini menggunakan chain fallback untuk memastikan ucapan selalu bisa digenerate:

**Urutan Fallback:**
1. GLM-4-Flash (Z.ai) → Paling cepat & murah
2. Google Gemini API → Alternatif berkualitas tinggi
3. Sumopod API (gpt-4o-mini) → Fallback terakhir
4. Hardcoded messages → Jika semua API gagal

### 1. GLM API Key (Utama, Wajib)
1. Daftar di https://bigmodel.cn
2. Masuk ke User Center → API Keys
3. Buat key baru
4. Isi ke `GLM_API_KEY` di `.env`

Model yang digunakan: `glm-4.7-flashx` (gratis / sangat murah)

### 2. Gemini API Key (Opsional, Fallback)
1. Daftar di https://makersuite.google.com
2. Buat project baru di Google Cloud Console
3. Enable Gemini API
4. Buat API key
5. Isi ke `GEMINI_API_KEY` di `.env`

### 3. Sumopod API Key (Opsional, Fallback Terakhir)
1. Daftar di https://sumopod.com
2. Dapatkan API key
3. Isi ke `SUMOPOD_API_KEY` di `.env`

Model yang digunakan: `gpt-4o-mini`

**Tips:** Minimal satu API key harus diisi (GLM, Gemini, atau Sumopod). Lebih banyak opsi = lebih reliable.

---

## 🎁 Cara Kirim Dana Kaget

Nomor WA tersimpan private di PostgreSQL. Untuk memilih pemenang:

```sql
-- Lihat komentar yang belum dapat reward
SELECT id, nama, pesan, whatsapp, created_at
FROM komentar
WHERE rewarded = FALSE
ORDER BY RANDOM()
LIMIT 5;

-- Tandai sudah rewarded
UPDATE komentar SET rewarded = TRUE WHERE id = <ID>;
```

---

## ☁️ Deploy

### Railway / Render / Heroku
1. Push ke GitHub
2. Connect repo ke platform
3. Set environment variables:
   - `PORT` (otomatis di-set)
   - `DATABASE_URL` (dari PostgreSQL provider)
   - `GLM_API_KEY` (wajib, atau salah satu dari API keys berikut)
   - `GEMINI_API_KEY` (opsional, fallback)
   - `SUMOPOD_API_KEY` (opsional, fallback terakhir)
   - `DANA_KAGET_URL` (opsional, URL Dana Kaget untuk reward)
   - `SITE_OWNER` (opsional)
4. Jalankan `node src/db-init.js` sekali via console untuk setup database
5. (Opsional) Jalankan `node src/migrate-avatar.js` untuk update schema database yang sudah ada

### VPS / Coolify
```bash
npm install
node src/db-init.js
npm start
# Tambahkan Nginx reverse proxy ke port 3000
```

### Static Hosting (Vercel / Netlify / GitHub Pages)
Untuk deployment tanpa server (frontend only):

1. **Build static files:**
   ```bash
   npm run build
   ```

2. **Deploy folder `dist/` ke hosting pilihan:**
   - **Vercel**: Connect repo, set output directory ke `dist/`
   - **Netlify**: Drag & drop folder `dist/` atau connect repo
   - **GitHub Pages**: Push folder `dist/` ke branch `gh-pages`

3. **Catatan Penting:**
   - Mode static hanya menampilkan frontend (HTML/CSS/JS)
   - Fitur yang butuh server akan **tidak berfungsi**:
     - ❌ Generate ucapan AI (butuh backend)
     - ❌ Kirim komentar (butuh database)
     - ❌ Ambil daftar komentar (butuh database)
     - ❌ URL Dana Kaget (butuh environment variable)
   - Gunakan mode ini hanya jika ingin hosting frontend sebagai demo

Untuk fitur lengkap, gunakan deployment dengan server (Railway/Render/VPS).

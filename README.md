# HAMA PRO EDITING 🎵🎬

Aplikasi Video Slide & Visualizer Musik Profesional berbasis web dengan **Equalizer Liquid Melingkar**, **Transkripsi & Generator Lirik AI Otomatis**, **Audio-Reactive Video Effects**, dan **Ekspor Video MP4/WebM 60FPS**.

---

## 🚀 Panduan Deploy ke Vercel Lewat GitHub

Aplikasi ini sudah dikonfigurasi penuh dengan `vercel.json` dan Vercel Serverless Function (`/api`), sehingga Anda bisa langsung menghubungkan repositori GitHub Anda ke Vercel tanpa perlu konfigurasi rumit.

### Langkah 1: Push Repositori ke GitHub
1. Buat repositori baru di akun [GitHub](https://github.com/new) Anda (misalnya beri nama: `hama-pro-editing`).
2. Jalankan perintah git berikut di terminal komputer Anda:
```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan semua file
git add .

# Buat commit pertama
git commit -m "feat: inisialisasi HAMA PRO EDITING siap deploy Vercel"

# Hubungkan ke remote GitHub (ganti USERNAME dan REPO_NAME sesuai akun Anda)
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Push ke GitHub
git push -u origin main
```

---

### Langkah 2: Hubungkan Repositori ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Pada bagian **"Import Git Repository"**, cari repositori `hama-pro-editing` yang baru saja Anda push ke GitHub, lalu klik **"Import"**.

---

### Langkah 3: Pengaturan Konfigurasi di Vercel
Vercel akan otomatis mendeteksi konfigurasi dari file `vercel.json` yang sudah disediakan:
- **Framework Preset**: `Vite` *(terdeteksi otomatis)*
- **Root Directory**: `./` *(default)*
- **Build Command**: `npm run build` *(terdeteksi otomatis)*
- **Output Directory**: `dist` *(terdeteksi otomatis)*

---

### Langkah 4: Tambahkan Environment Variable (Opsional untuk Fitur AI)
Agar fitur cerdas **Transkripsi Lirik Otomatis dari Musik** dan **AI Lyric Generator** dapat berjalan di Vercel:
1. Pada menu **"Environment Variables"** di halaman konfigurasi Vercel:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Masukkan API Key Google Gemini Anda (dapatkan gratis dari [Google AI Studio](https://aistudio.google.com/app/apikey))
2. Klik **"Add"**.

*(Catatan: Jika Anda tidak memasukkan API Key, aplikasi tetap berjalan 100% normal untuk pengeditan video, visualizer equalizer, slide, musik latar, dan lirik manual/rhythm fallback).*

---

### Langkah 5: Klik Deploy!
1. Klik tombol **"Deploy"**.
2. Tunggu proses build selesai sekitar 1-2 menit.
3. Selamat! Website **HAMA PRO EDITING** Anda telah aktif secara langsung di domain Vercel (misal: `https://hama-pro-editing.vercel.app`).
4. Setiap kali Anda melakukan `git push` ke branch `main`, Vercel akan otomatis melakukan redeploy versi terbaru secara real-time!

---

## 🛠️ Menjalankan Secara Lokal di Komputer

```bash
# 1. Install dependensi
npm install

# 2. Salin environment variable
cp .env.example .env
# (Isi GEMINI_API_KEY di dalam .env jika ingin menggunakan fitur AI)

# 3. Jalankan server pengembangan
npm run dev
```

Buka browser Anda di `http://localhost:3000`.

---

## 📁 Struktur File Khusus Vercel
- `vercel.json` : Konfigurasi routing serverless API dan SPA fallback Vite di Vercel CDN.
- `api/app.ts` : Server Express modular yang mendukung request `/api` dan CORS.
- `api/index.ts` : Entry point Serverless Function yang dieksekusi otomatis oleh runtime Vercel.
- `server.ts` : Entry point untuk container Cloud Run / Docker dan server lokal.

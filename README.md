# 🪙 SAKUIN - Dompet Pintar & Celengan Pelajar

Aplikasi web pencatat keuangan harian dan celengan digital untuk pelajar dengan gaya visual **Mobile-First Soft Brutalism**. Dibangun menggunakan **React 19 + Vite**, **Tailwind CSS v4**, **Lucide React**, dan **Supabase Auth & Database (BaaS)** tanpa memerlukan custom backend.

---

## ✨ Fitur Utama

1. **Dual Balance Card**:
   - Menampilkan **Sisa Uang Saku** (Uang Jajan) & **Isi Celengan** (Tabungan) secara terpisah.
   - Indikator kesiapan belanja ("Siap Jajan", "Hemat Dulu", "Perlu Diisi").
   - Target tabungan dinamis dengan progress bar dan kalkulasi sisa yang perlu dikumpulkan.

2. **Pencatatan Transaksi Cepat**:
   - Pilihan tipe: **Keluar** (Jajan, Ongkos, Kas, Bekal, dll), **Masuk** (Dapat jajan / saku), dan **Tabungan** (Alokasi ke celengan).
   - Quick Amount chips (Rp2.000, Rp5.000, Rp10.000, Rp20.000, Rp50.000).
   - Validasi saldo sebelum transaksi agar tidak minus.

3. **Autentikasi & Multi-Pengguna**:
   - Login & Registrasi dengan Email & Password.
   - Dukungan Google OAuth.
   - Row Level Security (RLS) di Supabase memastikan data keuangan setiap pelajar aman dan terisolasi.

4. **Desain Mobile-First Soft Brutalism**:
   - Border tegas dengan bayangan retro pop-art yang lembut.
   - Palet warna lembut yang ramah mata.
   - Responsif untuk layar smartphone maupun laptop.

---

## 🚀 Menjalankan Proyek Lokal

1. **Clone repository**:
   ```bash
   git clone https://github.com/ARYAAAANNNNN/SAKUIN.git
   cd SAKUIN
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Environment**:
   Salin file `.env.example` menjadi `.env` dan masukkan kredensial Supabase Anda:
   ```bash
   cp .env.example .env
   ```
   Isi dengan:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Jalankan development server**:
   ```bash
   npm run dev
   ```

5. **Build untuk produksi**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Database & Auth**: Supabase (PostgreSQL + GoTrue)

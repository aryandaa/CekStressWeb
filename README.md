# CekTenang - Student Stress Detector Web

<p align="center">
  <strong>Frontend web untuk platform deteksi dan monitoring stres mahasiswa</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router"/>
  <img src="https://img.shields.io/badge/Axios-API_Client-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios"/>
</p>

---

## Tentang Proyek

**CekTenang Web** adalah aplikasi frontend React untuk membantu mahasiswa mencatat aktivitas harian, melihat skor stres, membaca insight, dan memantau rekomendasi personal dari sistem backend.

Repository ini sekarang hanya berisi **frontend web**. Backend API, database, dan service Machine Learning sudah dipisah ke repository/deployment masing-masing.

Frontend ini mengonsumsi backend production berikut secara default:

```text
https://cektenang-backend-production.up.railway.app/
```

Fitur utama frontend:

- Autentikasi pengguna: register, login, logout, forgot password, dan reset password
- Landing page publik
- Dashboard ringkasan skor stres dan aktivitas terbaru
- Input aktivitas harian dan draft aktivitas
- Riwayat aktivitas dan prediksi
- Halaman insights dengan narasi AI, grafik mingguan, kondisi akademik, dan prioritas dari database
- Profile akun, update nama, password, dan foto profil
- Dukungan Bahasa Indonesia dan English
- Dark mode dan light mode

---

## Arsitektur Sistem

```text
+---------------------------+        HTTPS/API        +-----------------------------------------------+
|  stress-detector-web      | ----------------------> |  Deployed Backend API                         |
|                           |                         |  Railway                                      |
|  React + Vite             |                         |  Railway production backend                  |
|  TailwindCSS              |                         |  atau backend lokal via VITE_API_BASE_URL    |
|  React Router             |                         |                                               |
|  Axios / Fetch client     |                         |  Auth, Activities, Predictions, Insights,     |
|                           |                         |  Recommendations, Profiles, Dashboard         |
+---------------------------+                         +-----------------------------------------------+
          |
          v
  Static build output
  dist/
```

Catatan:

- Repo ini tidak menjalankan PostgreSQL, Redis, RabbitMQ, Express API, atau service ML.
- Frontend hanya bertugas menampilkan UI dan memanggil endpoint backend.
- Base URL API dikelola dari `api.config.js` dan bisa dioverride memakai `VITE_API_BASE_URL`.

---

## Struktur Repository

```text
CekStressWeb/
|-- public/                         # Static public assets
|   |-- favicon.svg
|   `-- icons.svg
|
|-- layouts/                        # Layout halaman auth dan dashboard
|   |-- AuthLayout.jsx
|   |-- Layout.jsx
|   |-- LeftPanel.jsx
|   `-- RightPanel.jsx
|
|-- src/
|   |-- App.jsx                     # Route utama aplikasi
|   |-- index.jsx                   # Entry point React
|   |
|   |-- assets/                     # Logo, icon, dan image lokal
|   |-- components/                 # Komponen reusable
|   |   |-- ActivityHistory/
|   |   |-- ActivityInput/
|   |   |-- DiagnosticBox/
|   |   |-- Insights/
|   |   |-- Navbar/
|   |   |-- Sidebar/
|   |   `-- profile/
|   |
|   |-- contexts/                   # Theme, language, user, protected route
|   |-- pages/                      # Landing, auth, dashboard, activity, insight, profile
|   |-- services/                   # API client dan service per domain
|   `-- styles/                     # Style global TailwindCSS
|
|-- api.config.js                   # Konfigurasi base URL API
|-- vite.config.js                  # Konfigurasi Vite
|-- eslint.config.js                # Konfigurasi ESLint
|-- package.json                    # Script dan dependency frontend
|-- .env.example                    # Contoh environment variable
`-- README.md                       # Dokumentasi project ini
```

---

## Cara Menjalankan

### Prasyarat

| Tool | Versi Minimum |
|---|---|
| Node.js | >= 18 |
| npm | >= 9 |

### 1. Clone Repository

```bash
git clone https://github.com/Zetday/student-stress-detector-web.git
cd student-stress-detector-web
```

Jika nama folder lokal berbeda, masuk ke folder frontend ini:

```bash
cd CekStressWeb
```

### 2. Install Dependency

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Isi `.env` untuk menentukan backend yang dipakai:

```env
VITE_API_BASE_URL=https://cektenang-backend-production.up.railway.app/
```

Jika `.env` tidak dibuat, aplikasi tetap memakai default production backend dari `api.config.js`.

### 4. Jalankan Development Server

```bash
npm run dev
```

Aplikasi berjalan di:

```text
http://localhost:5173
```

### 5. Build Production

```bash
npm run build
```

Output build akan dibuat di folder:

```text
dist/
```

### 6. Preview Build

```bash
npm run preview
```

---

## Fitur Web Application

### Autentikasi

- Register akun dengan nama lengkap, email, dan password
- Login menggunakan email dan password
- Login dengan Google melalui endpoint backend
- Forgot password dan reset password
- Protected route untuk halaman dashboard, activity, insight, dan profile

### Landing Page

- Halaman publik untuk memperkenalkan CekTenang
- Navigasi ke login/register
- Preview fitur, cara kerja, manfaat, dan FAQ
- Dark/light mode

### Dashboard

- Ringkasan skor stres terbaru
- Statistik aktivitas dan prediksi
- Grafik tren stres
- Ringkasan jurnal terakhir
- Kondisi akademik dan lifestyle berdasarkan data backend

### Aktivitas Harian

- Input data aktivitas harian mahasiswa
- Simpan draft aktivitas
- Submit aktivitas untuk diproses backend
- Panel hasil analisis setelah prediksi tersedia

Data aktivitas yang dikirim mencakup:

```text
sleep_hours, study_hours, screen_time_hours, social_media_hours,
physical_activity_minutes, caffeine_intake_mg, mood_score,
fatigue_level, assignment_load, deadline_pressure,
social_interaction_score, financial_worry_score, health_condition_score,
daily_note, activity_date, activity_status
```

### Riwayat Aktivitas

- Menampilkan aktivitas selesai dan draft
- Filter berdasarkan status dan periode tanggal
- Sorting berdasarkan tanggal atau skor stres
- Lanjutkan pengisian draft
- Lihat detail aktivitas tertentu

### Insights & Rekomendasi

- Insight naratif dari tabel/backend `insights`
- Prioritas hari ini dari endpoint `GET /recommendations`
- Bagian prioritas tidak memakai data statis frontend
- Jika tabel `recommendations` kosong, UI menampilkan empty state
- Grafik aktivitas mingguan dan intensitas stres dari riwayat aktivitas/prediksi

### Profile

- Menampilkan informasi akun
- Update nama lengkap
- Update foto profil
- Ganti password
- Statistik akun berdasarkan riwayat analisis

### Internasionalisasi

- Bahasa Indonesia
- English
- Preferensi bahasa disimpan di `localStorage`

### Tema

- Light mode
- Dark mode
- Preferensi tema disimpan di `localStorage`

---

## Machine Learning Service

Service Machine Learning tidak berada di repository ini.

Alur ML saat ini:

```text
Frontend Web -> Backend API -> ML Service -> Backend API -> Frontend Web
```

Frontend tidak memanggil ML service secara langsung. Semua proses prediksi, insight, dan rekomendasi dilakukan melalui backend API.

Data yang ditampilkan frontend berasal dari endpoint backend seperti:

| Fitur | Sumber Data |
|---|---|
| Skor stres | `/predictions` |
| Aktivitas | `/activities` |
| Insight naratif | `/insights/latest` atau `/insights` |
| Rekomendasi | `/recommendations` |
| Dashboard | `/dashboard` |

---

## API Documentation

Frontend menggunakan API backend production secara default:

```text
https://cektenang-backend-production.up.railway.app/
```

Base URL dikonfigurasi di:

```text
api.config.js
```

Endpoint yang dipakai frontend:

| Domain | Endpoint |
|---|---|
| Register | `POST /users` |
| Login | `POST /authentications` |
| Login Google | `POST /authentications/google` |
| Logout | `DELETE /authentications` |
| Forgot Password | `POST /authentications/forgot-password` |
| Reset Password | `POST /authentications/reset-password` |
| Profile | `GET /profiles/me` |
| Dashboard | `GET /dashboard` |
| Activities | `GET /activities`, `POST /activities`, `PUT /activities/:id`, `GET /activities/:id` |
| Predictions | `GET /predictions` |
| Insights | `GET /insights/latest`, `GET /insights` |
| Recommendations | `GET /recommendations` |

Jika backend dijalankan di environment lain, set:

```env
VITE_API_BASE_URL=https://domain-backend-kamu.com
```

---

## Database

Database tidak berada di repository frontend ini.

Frontend hanya membaca dan mengirim data melalui backend API. Tabel yang relevan di backend:

| Tabel | Dipakai untuk |
|---|---|
| `users` | Data akun pengguna |
| `authentications` | Sesi dan refresh token |
| `profiles` | Data profile pengguna |
| `daily_activities` | Input aktivitas harian |
| `stress_predictions` | Hasil prediksi stres |
| `insights` | Insight naratif AI |
| `recommendations` | Rekomendasi dan prioritas hari ini |

Contoh: section **Prioritas Hari Ini** di halaman `/Insight` mengambil data dari tabel `recommendations` melalui endpoint backend. Jika tabel tersebut kosong, frontend tidak menampilkan rekomendasi palsu.

---

## Keamanan

Bagian keamanan yang ditangani frontend:

- Menyimpan `accessToken` dan `refreshToken` di `localStorage`
- Menambahkan header `Authorization: Bearer <accessToken>` pada request API
- Redirect ke `/login` saat backend mengembalikan status `401`
- Melindungi halaman private dengan `ProtectedRoute`
- Tidak menyimpan secret backend di source frontend

Bagian keamanan seperti password hashing, validasi token, CORS, dan rate limiting ditangani oleh backend API.

---

## Fitur Export Email

Fitur export email tidak diimplementasikan langsung di frontend repository ini.

Jika backend menyediakan fitur export, frontend dapat menambahkan tombol/flow yang memanggil endpoint backend terkait. Pengiriman email, queue, dan pemrosesan laporan tetap menjadi tanggung jawab backend.

---

## Tech Stack Ringkasan

### Frontend

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=flat-square&logo=recharts&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_React-000000?style=flat-square&logo=lucide&logoColor=white)

### Development Tools

![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![PostCSS](https://img.shields.io/badge/PostCSS-DD3A0A?style=flat-square&logo=postcss&logoColor=white)

### External Services

![Railway](https://img.shields.io/badge/Railway-Backend_API-0B0D0E?style=flat-square&logo=railway&logoColor=white)

---

## Deployment

Frontend ini dapat dideploy sebagai static site.

### Build Command

```bash
npm run build
```

### Output Directory

```text
dist
```

### Environment Variable

```env
VITE_API_BASE_URL=https://cektenang-backend-production.up.railway.app/
```

Untuk memakai backend production Railway, gunakan:

```env
VITE_API_BASE_URL=https://cektenang-backend-production.up.railway.app/
```

Contoh platform deployment:

- Vercel
- Netlify
- Railway Static
- Render Static Site
- Nginx/static hosting lain

Pastikan backend mengizinkan origin domain frontend melalui konfigurasi CORS.

---

## Tim Pengembang

Capstone Project - DBS Camp Dicoding

---

## Lisensi

ISC

# Setor.in - Aplikasi Tahfizh

Aplikasi web untuk mengelola setoran hafalan Al-Qur'an di Muallimin Yogyakarta.

## 📁 Struktur Proyek

```
sistemtahfizh/
├── assets/           # File gambar dan media
│   ├── logo-putih-muallimin.webp
│   └── muallimin.png
├── css/              # File stylesheet
│   └── style.css
├── js/               # File JavaScript
│   ├── app.js        # Logika aplikasi utama
│   └── config.js     # Konfigurasi aplikasi
├── docs/             # Dokumentasi tambahan
├── index.html        # Halaman utama aplikasi
└── manifest.json     # PWA manifest
```

## 🚀 Fitur Utama

- **Input Setoran**: Catat setoran hafalan santri dengan mudah
- **Validasi Musyrif**: Sistem validasi untuk musyrif
- **Statistik Real-time**: Dashboard dengan statistik dan progress
- **Laporan & Analisis**: Laporan setoran dan analisis progress santri
- **Progressive Web App**: Dapat diinstall sebagai aplikasi mobile

## 🔧 Teknologi

- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript
- **Charts**: Chart.js untuk visualisasi data
- **PDF Export**: jsPDF & jsPDF-AutoTable
- **Backend**: Google Apps Script (untuk penyimpanan data)

## 📱 Penggunaan

1. Buka `index.html` di browser
2. Pilih role (Musyrif, Santri, atau Wali Santri)
3. Untuk Musyrif: masukkan password untuk akses penuh
4. Mulai input dan kelola setoran hafalan

## ⚙️ Konfigurasi

Edit file `js/config.js` untuk mengubah:
- URL Google Apps Script
- Deadline periode tahfizh
- Sistem scoring
- Nama-nama musyrif
- Dan konfigurasi lainnya

## 📝 Catatan

Aplikasi ini terintegrasi dengan Google Spreadsheet melalui Google Apps Script untuk penyimpanan data. Pastikan URL script di `config.js` sudah benar.

## 🎨 Customization

- **CSS**: Edit `css/style.css` untuk mengubah styling
- **Logo**: Ganti file di folder `assets/`
- **Warna Tema**: Edit konfigurasi TailwindCSS di `index.html`

## 📄 Lisensi

Dibuat untuk Muallimin Yogyakarta

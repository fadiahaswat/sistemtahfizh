# Panduan Pengembangan Sistem Tahfizh

## 📋 Daftar File dan Fungsinya

### File Utama
- **index.html** - Halaman utama aplikasi yang berisi seluruh UI
- **manifest.json** - Konfigurasi Progressive Web App (PWA)

### JavaScript (`js/`)
- **config.js** - Konfigurasi aplikasi (URL, deadline, scoring, dll)
- **app.js** - Logika utama aplikasi (2000+ baris kode)

### CSS (`css/`)
- **style.css** - Stylesheet tambahan untuk komponen khusus

### Assets (`assets/`)
- **muallimin.png** - Logo sekolah format PNG
- **logo-putih-muallimin.webp** - Logo putih format WebP

## 🔧 Cara Mengembangkan

### Mengubah Konfigurasi
Edit file `js/config.js` untuk:
- URL Google Apps Script
- Deadline periode tahfizh
- Sistem scoring
- Daftar musyrif
- Override kelas

### Mengubah UI/Layout
Edit file `index.html` untuk:
- Struktur halaman
- Komponen UI
- Inline styles (jika ada)

### Mengubah Logika Aplikasi
Edit file `js/app.js` untuk:
- Fungsi-fungsi aplikasi
- Event handlers
- API calls ke Google Sheets
- Validasi data

### Mengubah Styling
Edit file `css/style.css` untuk:
- Custom styles yang tidak ada di Tailwind
- Glassmorphism effects
- Animasi custom

## 📝 Struktur Code di app.js

```
1. STATE MANAGEMENT - State aplikasi global
2. DOM CACHING - Cache elemen DOM
3. UTILITIES - Fungsi helper
4. API FUNCTIONS - Komunikasi dengan backend
5. UI FUNCTIONS - Render UI dan update tampilan
6. EVENT HANDLERS - Handler untuk interaksi user
7. INITIALIZATION - Inisialisasi aplikasi
```

## 🚀 Deployment

Aplikasi ini adalah Static Web App yang bisa di-host di:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Atau web server biasa

Yang perlu diperhatikan:
1. Pastikan semua path relatif (sudah benar)
2. Pastikan URL Google Apps Script di config.js benar
3. Upload semua folder (assets, css, js) beserta file root

## 🔐 Keamanan

- Password musyrif disimpan di memori saja (tidak persistent)
- Data disimpan di Google Spreadsheet
- Validasi di frontend dan backend (Apps Script)

## 📊 Integrasi Backend

Backend menggunakan Google Apps Script yang:
- Mengelola Google Spreadsheet
- Menyediakan API endpoint
- Handle CRUD operations
- Validasi dan authorization

## 💡 Tips Maintenance

1. **Backup Regular** - Backup spreadsheet secara berkala
2. **Test Sebelum Deploy** - Test di local dulu sebelum push
3. **Version Control** - Gunakan Git untuk tracking changes
4. **Documentation** - Update dokumentasi saat ada perubahan besar
5. **Code Review** - Review code sebelum merge ke main branch

## 🐛 Troubleshooting

### Aplikasi tidak load
- Cek console browser untuk error
- Pastikan semua file terload dengan benar
- Cek network tab untuk failed requests

### Data tidak tersimpan
- Cek URL Google Apps Script
- Cek authorization di Apps Script
- Cek response di network tab

### UI tidak sesuai
- Clear cache browser
- Hard refresh (Ctrl+Shift+R)
- Cek apakah CSS terload

## 📞 Kontak

Untuk pertanyaan atau bantuan, hubungi maintainer repository.

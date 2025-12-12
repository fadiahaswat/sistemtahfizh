/**
 * utils.js
 * Berisi fungsi-fungsi bantuan (helpers) untuk logika waktu dan tanggal.
 */

// 1. Fungsi untuk menambahkan nol di depan angka satuan (misal: 1 menjadi 01)
// Digunakan agar tampilan jam rapi (04:05, bukan 4:5)
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

// 2. Fungsi untuk mendapatkan Waktu Sekarang dalam format HH:MM:SS
function getCurrentTime() {
    const date = new Date();
    const h = addZero(date.getHours());
    const m = addZero(date.getMinutes());
    const s = addZero(date.getSeconds());
    return h + ":" + m + ":" + s;
}

// 3. Fungsi untuk mendapatkan Tanggal Masehi lengkap (bahasa Indonesia)
// Output contoh: "Jumat, 12 Desember 2025"
function getDateMasehi() {
    const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const daftarBulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    
    const date = new Date();
    const hari = daftarHari[date.getDay()];
    const tanggal = date.getDate();
    const bulan = daftarBulan[date.getMonth()];
    const tahun = date.getFullYear();

    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
}

// 4. Fungsi untuk mendapatkan Tanggal Hijriyah
// Menggunakan fitur bawaan browser (Intl.DateTimeFormat)
// Output contoh: "20 Jumadilakhir 1447" (tergantung kalender sistem)
function getHijriDate() {
    const date = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        calendar: 'islamic-umalqura' 
    };
    // 'id-ID-u-ca-islamic' memaksa format Indonesia dengan kalender Islam
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic', options).format(date);
}

// 5. Fungsi Menghitung Mundur (Countdown)
// Digunakan untuk menghitung sisa waktu menuju Adzan atau Iqomah
// Parameter: targetTimeStr (format "HH:MM", misal "18:00")
function getCountdown(targetTimeStr) {
    const now = new Date();
    
    // Memecah target waktu (misal "18:00") menjadi jam dan menit
    const waktuSplit = targetTimeStr.split(':');
    const targetH = parseInt(waktuSplit[0]);
    const targetM = parseInt(waktuSplit[1]);
    
    // Membuat objek tanggal untuk target waktu
    let targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);

    // LOGIKA PENTING:
    // Jika waktu target lebih kecil dari waktu sekarang (misal sekarang 20:00, target 04:00 Subuh),
    // berarti targetnya adalah BESOK hari. Maka tanggal target ditambah 1.
    if (targetDate < now) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    // Hitung selisih dalam milidetik
    const diff = targetDate - now;

    // Konversi milidetik ke Jam, Menit, Detik
    const jam = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const menit = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        hours: addZero(jam),
        minutes: addZero(menit),
        seconds: addZero(detik),
        totalMilliseconds: diff // Dikembalikan juga untuk pengecekan jika waktu habis (<= 0)
    };
}

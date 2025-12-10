// KONFIGURASI APLIKASI
const AppConfig = {
    // URL Web App Google Apps Script Anda (Pastikan sudah di-deploy terbaru)
    scriptURL: 'https://script.google.com/macros/s/AKfycbyl2FCcGUtolkJIDsoiTYFKeKp8IQwHT0V3z8n1pOHH9CLiyvYZTBaimrojILJM_A-HLg/exec',
    
    // Urutan Musyrif di Dropdown
    musyrifSortOrder: ['Andi Aqillah Fadia Haswat', 'Abdullah'], 
    
    // Deadline
    deadlineJuz30Score: new Date('2026-01-03T23:59:59'),
    deadlineTahfizhTuntas: new Date('2025-09-30T23:59:59'),
    
    // Mengambil data dari file data-hafalan.js (HAFALAN_DATA harus di-load sebelumnya di HTML)
    hafalanData: HAFALAN_DATA,
    
    // Santri List dikosongkan karena sekarang diambil dari server (Google Sheets)
    santriList: []
};

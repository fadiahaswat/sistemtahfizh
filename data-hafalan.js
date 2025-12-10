// DATA STATIS UNTUK HAFALAN (JUMLAH HALAMAN & DAFTAR SURAT)
const HAFALAN_DATA = {
    juzPageCounts: {
        'juz30_setengah': 9,
        '30': 20, '29': 20, '28': 20, '27': 20, '26': 20, '25': 20, '24': 20, '5': 20, '1': 20,
    },
    surahData: {
        '30': {
            list: ['An-Naba', 'An-Nazi\'at', 'Abasa', 'At-Takwir', 'Al-Infithor', 'Al-Muthaffifin', 'Al-Insyiqaq', 'Al-Buruj', 'At-Thariq', 'Al-A\'la', 'Al-Ghasyiyah', 'Al-Fajr', 'Al-Balad', 'Asy-Syams', 'Al-Lail', 'Ad-Duha', 'Al-Insyirah', 'At-Tin', 'Al-\'Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-\'Adiyat', 'Al-Qari\'ah', 'At-Takatsur', 'Al-\'Ashr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Ma\'un', 'Al-Kautsar', 'Al-Kafirun', 'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'],
            pages: { 'An-Naba': 1, 'An-Nazi\'at': 1, 'Abasa': 1, 'At-Takwir': 1, 'Al-Infithor': 1, 'Al-Muthaffifin': 1, 'Al-Insyiqaq': 1, 'Al-Buruj': 1, 'At-Thariq': 1, 'Al-A\'la': 1, 'Al-Ghashiyah': 1, 'Al-Fajr': 1, 'Al-Balad': 1, 'Asy-Syams': 0.5, 'Al-Lail': 0.5, 'Ad-Duha': 0.5, 'Al-Insyirah': 0.5, 'At-Tin': 0.5, 'Al-\'Alaq': 0.5, 'Al-Qadr': 0.5, 'Al-Bayyinah': 0.5, 'Az-Zalzalah': 0.25, 'Al-\'Adiyat': 0.25, 'Al-Qari\'ah': 0.25, 'At-Takatsur': 0.25, 'Al-\'Asr': 0.25, 'Al-Humazah': 0.25, 'Al-Fil': 0.25, 'Quraysh': 0.25, 'Al-Ma\'un': 0.25, 'Al-Kautsar': 0.25, 'Al-Kafirun': 0.25, 'An-Nasr': 0.25, 'Al-Lahab': 0.25, 'Al-Ikhlas': 0.25, 'Al-Falaq': 0.25, 'An-Nas': 0.25 }
        },
        '29': {
            list: ['Al-Mulk', 'Al-Qolam', 'Al-Haaqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddatsir', 'Al-Qiyamah', 'Al-Insaan', 'Al-Mursalat'],
            pages: { 'Al-Mulk': 2, 'Al-Qolam': 2, 'Al-Haaqqah': 2, 'Al-Ma\'arij': 2, 'Nuh': 2, 'Al-Jinn': 2, 'Al-Muzzammil': 1, 'Al-Muddatsir': 2, 'Al-Qiyamah': 1, 'Al-Insaan': 2, 'Al-Mursalat': 2 }
        },
        '28': {
            list: ['Al-Mujadalah', 'Al-Hasyr', 'Al-Mumtahanah', 'Ash-Shaf', 'Al-Jumu\'ah', 'Al-Munaafiquun', 'At-Taghaabun', 'At-Thalaaq', 'At-Tahriim'],
            pages: { 'Al-Mujadalah': 3.5, 'Al-Hasyr': 3.5, 'Al-Mumtahanah': 2.5, 'Ash-Shaf': 1.5, 'Al-Jumu\'ah': 1, 'Al-Munaafiquun': 2, 'At-Taghaabun': 2, 'At-Thalaaq': 2, 'At-Tahriim': 2 }
        },
        '27': {
            list: ['Adz-Dzaariyaat', 'Ath-Thuur', 'An-Najm', 'Al-Qamar', 'Ar-Rahmaan', 'Al-Waaqi\'ah', 'Al-Hadiid'],
            pages: { 'Adz-Dzaariyaat': 1.5, 'Ath-Thuur': 2.5, 'An-Najm': 2.5, 'Al-Qamar': 3, 'Ar-Rahmaan': 3, 'Al-Waaqi\'ah': 3, 'Al-Hadiid': 4.5 }
        },
        '26': {
            list: ['Al-Jatsiyah', 'Al-Ahqaaf', 'Muhammad', 'Al-Fath', 'Al-Hujuraat', 'Qaaf', 'Adz-Dzaariyaat'],
            pages: { 'Al-Jatsiyah': 0.5, 'Al-Ahqaaf': 4.5, 'Muhammad': 4, 'Al-Fath': 4.5, 'Al-Hujuraat': 2.5, 'Qaaf': 2.5, 'Adz-Dzaariyaat': 1.5 }
        },
        '25': {
            list: ['Fussilat', 'Asy-Syuuraa', 'Az-Zukhruf', 'Ad-Dukhaan', 'Al-Jatsiyah'],
            pages: { 'Fussilat': 1, 'Asy-Syuuraa': 6.5, 'Az-Zukhruf': 6.5, 'Ad-Dukhaan': 3, 'Al-Jatsiyah': 3 }
        },
        '24': {
            list: ['Az-Zumar', 'Ghafir', 'Fussilat'],
            pages: { 'Az-Zumar': 5.5, 'Ghafir': 9.5, 'Fussilat': 5}
        },
        '5': {
            list: ['An-Nisaa 24-26', 'An-Nisaa 27-33', 'An-Nisaa 34-37', 'An-Nisaa 38-44', 'An-Nisaa 45-51', 'An-Nisaa 52-59', 'An-Nisaa 60-65', 'An-Nisaa 66-73', 'An-Nisaa 74-79', 'An-Nisaa 80-86', 'An-Nisaa 87-91', 'An-Nisaa 92-94', 'An-Nisaa 95-101', 'An-Nisaa 102-105', 'An-Nisaa 106-113', 'An-Nisaa 114-121', 'An-Nisaa 122-127', 'An-Nisaa 128-134', 'An-Nisaa 135-140', 'An-Nisaa 141-147'],
            pages: { 'An-Nisaa 24-26': 1, 'An-Nisaa 27-33': 1, 'An-Nisaa 34-37': 1, 'An-Nisaa 38-44': 1, 'An-Nisaa 45-51': 1, 'An-Nisaa 52-59': 1, 'An-Nisaa 60-65': 1, 'An-Nisaa 66-73': 1, 'An-Nisaa 74-79': 1, 'An-Nisaa 80-86': 1, 'An-Nisaa 87-91': 1, 'An-Nisaa 92-94': 1, 'An-Nisaa 95-101': 1, 'An-Nisaa 102-105': 1, 'An-Nisaa 106-113': 1, 'An-Nisaa 114-121': 1, 'An-Nisaa 122-127': 1, 'An-Nisaa 128-134': 1, 'An-Nisaa 135-140': 1, 'An-Nisaa 141-147': 1}
        },
        '1': {
            list: ['Al-Fatihah', 'Al-Baqarah 1-5', 'Al-Baqarah 6-16', 'Al-Baqarah 17-24', 'Al-Baqarah 25-29', 'Al-Baqarah 30-37', 'Al-Baqarah 38-48', 'Al-Baqarah 49-57', 'Al-Baqarah 58-61', 'Al-Baqarah 62-69', 'Al-Baqarah 70-76', 'Al-Baqarah 77-83', 'Al-Baqarah 84-88', 'Al-Baqarah 89-93', 'Al-Baqarah 94-101', 'Al-Baqarah 102-105', 'Al-Baqarah 106-112', 'Al-Baqarah 113-119', 'Al-Baqarah 120-126', 'Al-Baqarah 127-134', 'Al-Baqarah 135-141'],
            pages: { 'Al-Fatihah': 0.5, 'Al-Baqarah 1-5': 0.5, 'Al-Baqarah 6-16': 1, 'Al-Baqarah 17-24': 1, 'Al-Baqarah 25-29': 1, 'Al-Baqarah 30-37': 1, 'Al-Baqarah 38-48': 1, 'Al-Baqarah 49-57': 1, 'Al-Baqarah 58-61': 1, 'Al-Baqarah 62-69': 1, 'Al-Baqarah 70-76': 1, 'Al-Baqarah 77-83': 1, 'Al-Baqarah 84-88': 1, 'Al-Baqarah 89-93': 1, 'Al-Baqarah 94-101': 1, 'Al-Baqarah 102-105': 1, 'Al-Baqarah 106-112': 1, 'Al-Baqarah 113-119': 1, 'Al-Baqarah 120-126': 1, 'Al-Baqarah 127-134': 1, 'Al-Baqarah 135-141': 1}
        }
    }
};

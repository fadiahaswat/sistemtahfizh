/**
 * utils.js
 * Berisi fungsi-fungsi bantuan (helpers) untuk memproses data dan manipulasi DOM sederhana.
 * File ini tidak bergantung pada State global aplikasi.
 */

const Utils = {
    // 1. Fungsi untuk memproses data referensi Hafalan (Juz & Surat) dari server
    processHafalanData: (refJuz, refSurat) => {
        const processed = {
            juzPageCounts: {},
            surahData: {}
        };

        // A. Proses Juz Page Counts
        if (refJuz) {
            refJuz.forEach(item => {
                processed.juzPageCounts[item.key] = item.val;
            });
        }

        // B. Proses Surah Data
        if (refSurat) {
            refSurat.forEach(item => {
                const juzKey = item.juz;
                
                if (!processed.surahData[juzKey]) {
                    processed.surahData[juzKey] = {
                        list: [],
                        pages: {}
                    };
                }

                processed.surahData[juzKey].list.push(item.nama);
                processed.surahData[juzKey].pages[item.nama] = parseFloat(item.halaman);
            });
        }

        return processed;
    },

    // 2. Fungsi untuk mengisi elemen <select> (Dropdown) dengan opsi
    populateSelect: (selectElement, options, placeholder) => {
        selectElement.innerHTML = '';
        if (placeholder) {
            selectElement.add(new Option(placeholder, ''));
        }
        
        options.forEach(opt => {
            // Support input berupa array string ['A', 'B'] atau object [{text:'A', value:'1'}]
            const option = (typeof opt === 'string')
                ? new Option(opt, opt)
                : new Option(opt.text, opt.value);
            
            selectElement.add(option);
        });
    },

    // 3. Fungsi untuk menormalisasi nama (menghapus karakter aneh untuk pencarian/ID)
    normalizeName: (name) => {
        return typeof name !== 'string' 
            ? '' 
            : name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    },

    // 4. Helper cepat untuk mengubah Text Content elemen berdasarkan Selector
    setText: (element, selector, text) => {
        const el = element.querySelector(selector);
        if (el) el.textContent = text;
    },

    // 5. Helper cepat untuk mengubah Inner HTML elemen berdasarkan Selector
    setHTML: (element, selector, html) => {
        const el = element.querySelector(selector);
        if (el) el.innerHTML = html;
    }
};

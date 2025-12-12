// utils.js
const Utils = {
    // Memproses data hafalan mentah dari server menjadi struktur yang mudah dipakai
    processHafalanData: (refJuz, refSurat) => {
        const processed = {
            juzPageCounts: {},
            surahData: {}
        };

        // 1. Proses Juz Page Counts
        if (refJuz) {
            refJuz.forEach(item => {
                processed.juzPageCounts[item.key] = item.val;
            });
        }

        // 2. Proses Surah Data
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

    // Mengisi dropdown select dengan option
    populateSelect: (selectElement, options, placeholder) => {
        selectElement.innerHTML = '';
        if (placeholder) selectElement.add(new Option(placeholder, ''));
        options.forEach(opt => {
            const option = (typeof opt === 'string')
                ? new Option(opt, opt)
                : new Option(opt.text, opt.value);
            selectElement.add(option);
        });
    },

    // Membersihkan string nama agar mudah dicocokkan
    normalizeName: (name) => {
        return typeof name !== 'string' ? '' : name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    },

    // Helper untuk set textContent
    setText: (element, selector, text) => {
        const el = element.querySelector(selector);
        if (el) el.textContent = text;
    },

    // Helper untuk set innerHTML
    setHTML: (element, selector, html) => {
        const el = element.querySelector(selector);
        if (el) el.innerHTML = html;
    }
};

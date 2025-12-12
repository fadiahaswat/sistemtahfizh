// api.js
const API = {
    fetchSetoranData: async () => {
        try {
            // AppConfig diambil dari config.js
            const response = await fetch(AppConfig.scriptURL);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            localStorage.setItem('cachedData', JSON.stringify(data)); 
            return data;
        } catch (error) {
            console.warn('Mengambil data offline dari cache...');
            const cached = localStorage.getItem('cachedData');
            if (cached) return JSON.parse(cached);
            
            // Menggunakan UI.showToast nanti di main.js atau panggil global UI jika sudah di-load, 
            // tapi agar aman kita return array kosong dulu.
            console.error('Gagal memuat data (Offline & Cache kosong).');
            return [];
        }
    },

    postData: async (formData) => {
        try {
            const response = await fetch(AppConfig.scriptURL, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Gagal mengirim data:', error);
            return { result: 'error', error: error.message };
        }
    }
};

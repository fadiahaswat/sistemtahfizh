document.addEventListener('DOMContentLoaded', () => {
    
    const State = {
        allSetoran: [],
        rawSantriList: [], // Menyimpan data santri mentah dari server
        santriData: [],    // Data santri yang sudah diolah (nilai, status tuntas, dll)
        classGroups: {},
        setoranIdToDelete: null,
        searchDebounceTimer: null,
        santriNameMap: new Map() 
    };

    const DOM = {};
    function cacheDOMElements() {
        const ids = ['main-nav', 'main-content', 'setoranForm', 'tanggal', 'nowBtn', 'musyrif', 'namaSantri', 'santriId', 'kelas', 'program', 'jenis', 'juz', 'halaman-container', 'halaman', 'surat-container', 'surat', 'kualitas', 'setoranTableBody', 'history-row-template', 'search-riwayat', 'suggestions-container', 'filter-tanggal-mulai', 'filter-tanggal-akhir', 'filter-program', 'filter-kelas', 'stats-santri-aktif', 'stats-santri-tuntas', 'stats-santri-belum-tuntas', 'mutqin-juz29-progress-container', 'mutqin-juz30-progress-container', 'rekap-select', 'rekap-content-container', 'toast', 'toast-message', 'toast-icon', 'passwordConfirmModal', 'passwordInput', 'passwordError', 'cancelPasswordBtn', 'confirmPasswordBtn', 'icon-legend-riwayat', 'datetime-container', 'icon-legend-rekap', 'rekap-content-template', 'mutqin-unggulan-progress-container', 'tuntas-tracking-accordion', 'mutqin-unggulan-circle', 'mutqin-juz30-circle', 'mutqin-juz29-circle', 'mutqin-unggulan-details', 'mutqin-juz30-details', 'mutqin-juz29-details', 'peringkat-section', 'tahfizh-tuntas-tracking-section', 'help-button', 'helpModal', 'closeHelpModal', 'submit-button', 'submit-button-text', 'submit-button-icon', 'submit-spinner'];
        ids.forEach(id => {
            // Mengubah kebab-case menjadi camelCase untuk nama properti DOM
            const propName = id.replace(/-(\w)/g, (_, p1) => p1.toUpperCase());
            DOM[propName] = document.getElementById(id);
        });
        DOM.pages = document.querySelectorAll('.page-content');
        DOM.skeletonContainers = document.querySelectorAll('.skeleton-container');
    }

    const Utils = {
        fetchSetoranData: async () => {
            try {
                const response = await fetch(AppConfig.scriptURL);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Gagal memuat data setoran:', error);
                UI.showToast('Gagal memuat riwayat setoran.', 'error');
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
                UI.showToast(`Gagal: ${error.message}`, 'error');
                return { result: 'error', error: error.message };
            }
        },
        populateSelect: (selectElement, options, placeholder) => {
            selectElement.innerHTML = '';
            if (placeholder) {
                selectElement.add(new Option(placeholder, ''));
            }
            options.forEach(opt => {
                const option = (typeof opt === 'string')
                    ? new Option(opt, opt)
                    : new Option(opt.text, opt.value);
                selectElement.add(option);
            });
        },
        normalizeName: (name) => {
            return typeof name !== 'string' ? '' : name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
        }
    };

    const UI = {
        showToast: (message, type = 'success') => {
            DOM.toastMessage.textContent = message;
            const isSuccess = type === 'success';
            DOM.toastIcon.innerHTML = isSuccess
                ? `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`
                : `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            DOM.toastIcon.classList.toggle('text-green-400', isSuccess);
            DOM.toastIcon.classList.toggle('text-red-400', !isSuccess);
            DOM.toast.classList.add('show');
            setTimeout(() => DOM.toast.classList.remove('show'), 3000);
        },
        switchPage: (pageId, showSkeleton = true) => {
            if (!pageId) return;
            DOM.pages.forEach(page => page.classList.add('hidden'));
            if (showSkeleton) {
                const skeleton = document.getElementById(`skeleton-${pageId}`);
                if (skeleton) skeleton.classList.remove('hidden');
            }
            setTimeout(() => {
                DOM.skeletonContainers.forEach(s => s.classList.add('hidden'));
                const targetPage = document.getElementById(pageId);
                if (targetPage) targetPage.classList.remove('hidden');
                DOM.mainNav.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
                const activeLink = DOM.mainNav.querySelector(`a[data-page="${pageId}"]`);
                if (activeLink) activeLink.classList.add('active');
            }, 150);
        },
        updateDateTime: () => {
            const now = new Date();
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            const islamicDateOptions = { day: 'numeric', month: 'long', year: 'numeric' };

            DOM.datetimeContainer.innerHTML = `
                <div class="text-center space-y-1">
                    <p class="text-2xl font-bold">${new Intl.DateTimeFormat('id-ID', timeOptions).format(now).replace(/\./g, ':')}</p>
                    <p class="text-xs font-semibold text-[var(--subtle-text)]">${new Intl.DateTimeFormat('id-ID', dateOptions).format(now)}</p>
                    <p class="text-xs font-semibold text-gray-500">${new Intl.DateTimeFormat('id-ID-u-ca-islamic', islamicDateOptions).format(now)}</p>
                </div>`;
        },
        renderAll: () => {
            UI.renderBeranda();
            UI.renderHistoryTable();
            UI.renderRekap();
        },
        renderBeranda: () => {
            const santriAktifIds = new Set(State.allSetoran.map(s => s.santriId));
            const totalSantri = State.rawSantriList.length; // Menggunakan rawSantriList
            const tuntasCount = State.santriData.filter(s => s.isTuntas).length;

            DOM.statsSantriAktif.textContent = `${santriAktifIds.size} / ${totalSantri}`;
            DOM.statsSantriTuntas.textContent = tuntasCount;
            DOM.statsSantriBelumTuntas.textContent = totalSantri - tuntasCount;

            UI.renderMutqinProgress();
            UI.renderTuntasTracking();
            UI.renderPeringkatNew();
            UI.renderTahfizhTuntasTrackingNew();
        },
        renderMutqinProgress: () => {
            const createProgress = (container, circleEl, detailsEl, santriList, color, checkFn) => {
                if (santriList.length > 0) {
                    container.classList.remove('hidden');
                    const tuntasCount = santriList.filter(checkFn).length;
                    const pct = Math.round((tuntasCount / santriList.length) * 100);
                    const radius = 45, circumference = 2 * Math.PI * radius;
                    const offset = circumference - (pct / 100) * circumference;
                    
                    circleEl.innerHTML = `
                        <svg class="w-full h-full" viewBox="0 0 100 100">
                            <circle class="text-gray-200/80" stroke-width="8" stroke="currentColor" fill="transparent" r="${radius}" cx="50" cy="50" />
                            <circle class="progress-ring-circle ${color}" stroke-width="8" stroke-linecap="round" stroke="currentColor" fill="transparent" r="${radius}" cx="50" cy="50" style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference};" />
                        </svg>
                        <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold ${color}">${pct}%</span>`;
                    
                    setTimeout(() => { 
                        const circle = circleEl.querySelector('.progress-ring-circle');
                        if(circle) circle.style.strokeDashoffset = offset;
                    }, 100);
                    
                    detailsEl.textContent = `${tuntasCount} dari ${santriList.length} santri tuntas.`;
                } else {
                    container.classList.add('hidden');
                }
            };
            
            const unggulan = State.santriData.filter(s => s.program === 'Unggulan');
            const tahfizh = State.santriData.filter(s => s.program === 'Tahfizh');
            
            createProgress(DOM.mutqinUnggulanProgressContainer, DOM.mutqinUnggulanCircle, DOM.mutqinUnggulanDetails, unggulan, 'text-sky-500', s => s.nilai >= 100);
            createProgress(DOM.mutqinJuz30ProgressContainer, DOM.mutqinJuz30Circle, DOM.mutqinJuz30Details, tahfizh, 'text-green-500', s => s.mutqinJuz.has(30));
            createProgress(DOM.mutqinJuz29ProgressContainer, DOM.mutqinJuz29Circle, DOM.mutqinJuz29Details, tahfizh, 'text-amber-500', s => s.mutqinJuz.has(29));
        },
        renderTuntasTracking: () => {
            const container = DOM.tuntasTrackingAccordion;
            container.innerHTML = '';
            for (const groupName in State.classGroups) {
                if (groupName === 'Khusus Tahfizh' || groupName === 'Seluruh Santri') continue;
                const group = State.classGroups[groupName];
                const tuntasCount = group.santri.filter(s => s.isTuntas).length;
                const totalCount = group.santri.length;
                const percentage = totalCount > 0 ? ((tuntasCount / totalCount) * 100).toFixed(0) : 0;
                const tuntasList = group.santri.filter(s => s.isTuntas).map(s => `<li>${s.nama}</li>`).join('') || '<li class="list-none text-gray-500">Belum ada</li>';
                const belumTuntasList = group.santri.filter(s => !s.isTuntas).map(s => `<li>${s.nama}</li>`).join('') || '<li class="list-none text-gray-500">Semua tuntas</li>';
                
                const item = document.createElement('div');
                item.className = 'glass-card rounded-lg overflow-hidden';
                item.innerHTML = `
                    <h2 class="accordion-header"><button type="button" class="accordion-button flex items-center justify-between w-full p-4 font-semibold text-left transition-colors hover:bg-[var(--hover-bg)]">
                        <span class="font-bold">${groupName}</span>
                        <div class="flex items-center gap-2 sm:gap-4">
                            <div class="hidden sm:flex items-center gap-2">
                                <div class="w-24 bg-gray-200 rounded-full h-2"><div class="bg-green-500 h-2 rounded-full" style="width: ${percentage}%"></div></div>
                                <span class="text-xs font-semibold">${percentage}%</span>
                            </div>
                            <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Tuntas: ${tuntasCount}</span>
                            <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">Belum: ${totalCount - tuntasCount}</span>
                            <svg class="accordion-chevron w-4 h-4 shrink-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </button></h2>
                    <div class="accordion-panel border-t border-[var(--card-border)] bg-white/10">
                        <div class="p-4 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div><h5 class="font-semibold text-green-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>Sudah Tuntas (${tuntasCount})</h5><ul class="space-y-1 list-disc list-inside">${tuntasList}</ul></div>
                            <div><h5 class="font-semibold text-red-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>Belum Tuntas (${totalCount - tuntasCount})</h5><ul class="space-y-1 list-disc list-inside">${belumTuntasList}</ul></div>
                        </div>
                    </div>`;
                container.appendChild(item);
            }
        },
        renderPeringkatNew: () => {
            const container = DOM.peringkatSection;
            container.innerHTML = `
                <h3 class="section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Peringkat Santri
                </h3>
                <div class="glass-card p-2 rounded-xl">
                    <div class="flex bg-gray-200/80 rounded-lg p-1 space-x-1" id="peringkat-program-tabs">
                        <button class="tab-peringkat flex-1 p-2 rounded-md text-sm font-semibold transition-colors duration-300" data-program="Tahfizh">Program Tahfizh</button>
                        <button class="tab-peringkat flex-1 p-2 rounded-md text-sm font-semibold transition-colors duration-300" data-program="Unggulan">Program Unggulan</button>
                    </div>
                    <div id="peringkat-content" class="mt-4 p-2"></div>
                </div>`;
            
            UI.renderPeringkatContent('Tahfizh');
            container.querySelector(`[data-program="Tahfizh"]`).classList.add('active');
        },
        renderPeringkatContent: (program) => {
            const contentContainer = document.getElementById('peringkat-content');
            const santriList = State.santriData.filter(s => s.program === program);

            const getPeringkat = (list, key) => list.sort((a, b) => b[key] - a[key]).slice(0, 5);

            const criteria = program === 'Tahfizh'
                ? [{ key: 'setoranCount', title: 'Paling Rajin (Total Setoran)', unit: 'setoran' }, { key: 'ziyadahPages', title: 'Hafalan Terbanyak (Ziyadah)', unit: 'hlm' }]
                : [{ key: 'setoranCount', title: 'Paling Rajin (Total Setoran)', unit: 'setoran' }, { key: 'unggulanPages', title: 'Hafalan Terbanyak (Halaman)', unit: 'hlm' }];

            const medalColors = ['bg-yellow-400', 'bg-gray-400', 'bg-yellow-600'];
            
            contentContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${criteria.map(c => `
                        <div>
                            <h4 class="font-bold text-center mb-3">${c.title}</h4>
                            <ul class="space-y-3">
                                ${getPeringkat(santriList, c.key).map((s, i) => `
                                    <li class="bg-white/50 p-3 rounded-lg shadow-sm flex items-center gap-4">
                                        <span class="flex-shrink-0 h-8 w-8 rounded-full ${medalColors[i] || 'bg-gray-300'} flex items-center justify-center font-bold text-white text-sm">${i + 1}</span>
                                        <div class="flex-grow">
                                            <p class="font-semibold text-sm">${s.nama}</p>
                                            <p class="text-xs text-[var(--subtle-text)]">Kelas ${s.kelas}</p>
                                        </div>
                                        <div class="text-right flex-shrink-0">
                                            <p class="font-bold text-amber-600 text-lg">${(s[c.key] || 0).toFixed(['ziyadahPages', 'unggulanPages'].includes(c.key) ? 1 : 0)}</p>
                                            <p class="text-xs text-gray-500">${c.unit}</p>
                                        </div>
                                    </li>
                                `).join('') || '<li class="text-center text-sm text-gray-500 col-span-1">Belum ada data.</li>'}
                            </ul>
                        </div>
                    `).join('')}
                </div>`;
        },
        renderTahfizhTuntasTrackingNew: () => {
            const container = DOM.tahfizhTuntasTrackingSection;
            container.innerHTML = `
                <h3 class="section-header">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Lacak Ketuntasan Khusus Tahfizh
                </h3>
                <div class="glass-card p-4 rounded-xl">
                    <div class="flex border-b border-[var(--input-border)]" id="tahfizh-juz-tabs">
                        <button class="tahfizh-tab flex-1 p-3 text-sm font-semibold border-b-2 border-transparent hover:bg-[var(--hover-bg)]" data-juz="30">Mutqin Juz 30</button>
                        <button class="tahfizh-tab flex-1 p-3 text-sm font-semibold border-b-2 border-transparent hover:bg-[var(--hover-bg)]" data-juz="29">Mutqin Juz 29</button>
                    </div>
                    <div id="tahfizh-content" class="mt-4"></div>
                </div>`;

            UI.renderTahfizhContent(30);
            container.querySelector(`[data-juz="30"]`).classList.add('text-amber-600', 'border-amber-500');
        },
        renderTahfizhContent: (juz, searchTerm = '') => {
            const contentContainer = document.getElementById('tahfizh-content');
            const tahfizhSantri = State.santriData.filter(s => s.program === 'Tahfizh');
            if (tahfizhSantri.length === 0) {
                contentContainer.innerHTML = '<p class="text-center text-gray-500">Tidak ada santri program Tahfizh.</p>';
                return;
            }

            const tuntasCount = tahfizhSantri.filter(s => s.mutqinJuz.has(juz)).length;
            const totalCount = tahfizhSantri.length;
            const percentage = totalCount > 0 ? Math.round((tuntasCount / totalCount) * 100) : 0;
            
            const lowerSearchTerm = searchTerm.toLowerCase();
            const tuntasList = tahfizhSantri.filter(s => s.mutqinJuz.has(juz) && s.nama.toLowerCase().includes(lowerSearchTerm));
            const belumTuntasList = tahfizhSantri.filter(s => !s.mutqinJuz.has(juz) && s.nama.toLowerCase().includes(lowerSearchTerm));

            contentContainer.innerHTML = `
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-semibold">Progres: ${tuntasCount} / ${totalCount} Santri</span>
                        <span class="text-sm font-bold text-amber-700">${percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-amber-500 h-2.5 rounded-full" style="width: ${percentage}%"></div></div>
                </div>
                <div class="mt-4 relative">
                     <input type="search" data-juz-filter="${juz}" value="${searchTerm}" class="tahfizh-search w-full pl-10 pr-4 py-2 text-sm glass-input rounded-lg" placeholder="Cari nama santri...">
                     <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 class="font-semibold text-green-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>Sudah Tuntas (${tuntasList.length})</h5>
                        <ul class="text-sm space-y-1 h-48 overflow-y-auto pr-2">${tuntasList.map(s => `<li>- ${s.nama}</li>`).join('') || '<li class="text-gray-500">Tidak ada</li>'}</ul>
                    </div>
                    <div>
                        <h5 class="font-semibold text-red-700 mb-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>Belum Tuntas (${belumTuntasList.length})</h5>
                        <ul class="text-sm space-y-1 h-48 overflow-y-auto pr-2">${belumTuntasList.map(s => `<li>- ${s.nama}</li>`).join('') || '<li class="text-gray-500">Semua tuntas</li>'}</ul>
                    </div>
                </div>`;
        },
        renderHistoryTable: () => {
            const searchTerm = DOM.searchRiwayat.value.toLowerCase();
            const programFilter = DOM.filterProgram.value;
            const classFilter = DOM.filterKelas.value;
            const startDate = DOM.filterTanggalMulai.value ? new Date(DOM.filterTanggalMulai.value) : null;
            const endDate = DOM.filterTanggalAkhir.value ? new Date(DOM.filterTanggalAkhir.value) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            const filtered = State.allSetoran
                .filter(setoran => {
                    const santri = State.santriData.find(st => st.id === setoran.santriId);
                    const classMatch = (classFilter === 'Semua') || (santri && (classFilter === '2CDGH' ? ['2C', '2D', '2G', '2H'].includes(santri.kelas) : santri.kelas === classFilter));
                    const dateMatch = (!startDate || new Date(setoran.createdAt) >= startDate) && (!endDate || new Date(setoran.createdAt) <= endDate);
                    const programMatch = (programFilter === 'Semua' || (santri && santri.program === programFilter));
                    const searchMatch = setoran.namaSantri.toLowerCase().includes(searchTerm);
                    return searchMatch && programMatch && classMatch && dateMatch;
                })
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 50);

            const tableBody = DOM.setoranTableBody;
            tableBody.innerHTML = '';
            if (filtered.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-500">Tidak ada data yang cocok dengan filter.</td></tr>`;
                return;
            }

            const fragment = document.createDocumentFragment();
            const template = DOM.historyRowTemplate;
            filtered.forEach(setoran => {
                const santri = State.santriData.find(s => s.id === setoran.santriId);
                const clone = template.content.cloneNode(true);
                clone.querySelector('.data-nama').textContent = setoran.namaSantri;
                clone.querySelector('.data-jenis').textContent = setoran.jenis;
                clone.querySelector('.data-juz-text').textContent = String(setoran.juz) === "juz30_setengah" ? "Setengah Juz 30" : `Juz ${setoran.juz}`;
                clone.querySelector('.data-unit').textContent = setoran.halaman ? `${setoran.halaman} hlm` : setoran.surat;
                clone.querySelector('.data-tanggal').textContent = new Date(setoran.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                clone.querySelector('.delete-btn').dataset.id = setoran.id;
                if (santri) {
                    const getProgramIcon = p => p === 'Unggulan' ? `<span title="Unggulan" class="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 text-gray-800 text-xs font-bold">U</span>` : `<span title="Tahfizh" class="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-200 text-purple-800 text-xs font-bold">T</span>`;
                    const getClassIcon = c => { let cl = 'bg-gray-200 text-gray-800'; const i = c.charAt(1); if (['A'].includes(i)) cl = 'bg-red-100 text-red-800'; if (['B'].includes(i)) cl = 'bg-yellow-100 text-yellow-800'; if (['C', 'D'].includes(i)) cl = 'bg-green-100 text-green-800'; if (['G', 'H'].includes(i)) cl = 'bg-blue-100 text-blue-800'; return `<span title="Kelas ${c}" class="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full ${cl} text-xs font-bold">${c}</span>`; };
                    clone.querySelector('.data-program-icon').innerHTML = getProgramIcon(santri.program);
                    clone.querySelector('.data-kelas-icon').innerHTML = getClassIcon(santri.kelas);
                }
                fragment.appendChild(clone);
            });
            tableBody.appendChild(fragment);
        },
        renderRekap: () => {
            const groupOrder = ['Seluruh Santri', 'Khusus Tahfizh', ...Object.keys(State.classGroups).filter(g => g !== 'Seluruh Santri' && g !== 'Khusus Tahfizh').sort()];
            const selectEl = DOM.rekapSelect;
            const contentContainer = DOM.rekapContentContainer;
            selectEl.innerHTML = '';
            contentContainer.innerHTML = '';
            if (groupOrder.length === 0) return;

            groupOrder.forEach((groupName, index) => {
                const tabId = groupName.replace(/, /g, '').replace(/ /g, '-');
                selectEl.add(new Option(groupName, tabId));
                
                const content = DOM.rekapContentTemplate.content.cloneNode(true).querySelector('.rekap-tab-content');
                content.id = `rekap-tab-${tabId}`;
                const group = State.classGroups[groupName];
                content.querySelector('.data-title').textContent = `Rekap Capaian - ${groupName}`;
                content.querySelector('.data-musyrif').textContent = `Musyrif: ${group.musyrif}`;
                content.querySelector('.data-timestamp').textContent = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
                content.querySelector('.export-pdf-btn').dataset.classGroup = groupName;
                if (index !== 0) { content.classList.add('hidden'); }
                contentContainer.appendChild(content);
                UI.renderSingleRekapTable(groupName, { isInitial: true });
            });
        },
        renderSingleRekapTable: (groupName, options = {}) => {
            const group = State.classGroups[groupName]; if (!group) return;
            const contentDiv = document.getElementById(`rekap-tab-${groupName.replace(/, /g, '').replace(/ /g, '-')}`); if (!contentDiv) return;
            
            if (options.isInitial && !group.sortState) {
                group.sortState = { column: 'nama', dir: 'asc' };
            }
            const { column, dir } = group.sortState;
            
            group.santri.sort((a, b) => { 
                let valA, valB;
                switch (column) {
                    case 'nama': valA = a.nama; valB = b.nama; break;
                    case 'nilai': valA = a.nilaiTampil; valB = b.nilaiTampil; break;
                    case 'ziyadah': valA = a.program === 'Tahfizh' ? a.ziyadahPages : -1; valB = b.program === 'Tahfizh' ? b.ziyadahPages : -1; break;
                    case 'keterangan': valA = a.isTuntas; valB = b.isTuntas; break;
                    default: return 0;
                }
                if (valA < valB) return dir === 'asc' ? -1 : 1;
                if (valA > valB) return dir === 'asc' ? 1 : -1;
                return 0;
            });

            contentDiv.querySelectorAll('th.sortable').forEach(th => {
                th.removeAttribute('data-sort-dir');
                const iconSpan = th.querySelector('.sort-icon');
                iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 12L3 8m4 8l4-8" /></svg>`;
                if (th.dataset.sort === column) {
                    th.setAttribute('data-sort-dir', dir);
                    iconSpan.innerHTML = dir === 'asc' 
                        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg>` 
                        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>`;
                }
            });

            const tableBody = contentDiv.querySelector('.data-table-body');
            tableBody.innerHTML = group.santri.map((santri, idx) => `
                <tr class="hover:bg-[var(--hover-bg)]">
                    <td class="px-4 py-2">${idx + 1}</td>
                    <td class="px-4 py-2 text-sm">${santri.nama}</td>
                    <td class="px-4 py-2 font-medium text-center">${santri.nilaiTampil}</td>
                    <td class="px-4 py-2 font-medium text-center">${santri.program === 'Tahfizh' ? (santri.ziyadahPages || 0).toFixed(1) : '-'}</td>
                    <td class="px-4 py-2 text-center"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${santri.isTuntas ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${santri.isTuntas ? 'Tuntas' : 'Belum Tuntas'}</span></td>
                </tr>`).join('');
        },
        exportRecapToPDF: (classGroup) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'pt', 'a4');
                const group = State.classGroups[classGroup];
                if (!group) return UI.showToast('Grup kelas tidak ditemukan.', 'error');
                
                const head = [['No.', 'Nama Santri', 'Nilai', 'Ziyadah (hlm)', 'Keterangan']];
                const body = group.santri.sort((a, b) => a.nama.localeCompare(b.nama)).map((santri, index) => [
                    index + 1,
                    santri.nama,
                    santri.nilaiTampil,
                    santri.program === 'Tahfizh' ? (santri.ziyadahPages || 0).toFixed(1) : '-',
                    santri.isTuntas ? 'Tuntas' : 'Belum Tuntas'
                ]);

                doc.autoTable({
                    head: head,
                    body: body,
                    theme: 'grid',
                    headStyles: { fillColor: [217, 119, 6] },
                    styles: { font: 'Inter', cellPadding: 6, valign: 'middle' },
                    columnStyles: { 
                        0: { cellWidth: 30 }, 
                        1: { cellWidth: 'auto' }, 
                        2: { cellWidth: 40, halign: 'center' }, 
                        3: { cellWidth: 70, halign: 'center' }, 
                        4: { cellWidth: 80, halign: 'center' } 
                    },
                    didParseCell: (data) => { if (data.column.index === 1) data.cell.styles.fontSize = 8; },
                    didDrawPage: (data) => {
                        doc.setFontSize(20); doc.setTextColor(180, 83, 9); doc.setFont('helvetica', 'bold');
                        doc.text('Laporan Capaian Tahfizh', data.settings.margin.left, 40);
                        doc.setFontSize(12); doc.setTextColor(40); doc.setFont('helvetica', 'normal');
                        doc.text(`Kelompok: ${classGroup} | Musyrif: ${group.musyrif}`, data.settings.margin.left, 58);
                        doc.setFontSize(8); doc.setTextColor(150);
                        doc.text(`Halaman ${data.pageNumber} dari ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 20);
                        doc.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 20, { align: 'right' });
                    },
                    margin: { top: 70, bottom: 40 }
                });
                doc.save(`rekap_setoran_${classGroup.replace(/, /g, '_').replace(/ /g, '-')}_${Date.now()}.pdf`);
            } catch (error) {
                console.error("PDF Export Error:", error);
                UI.showToast('Gagal mengekspor PDF. Pastikan library jsPDF termuat.', 'error');
            }
        }
    };

    const Core = {
        reloadData: async () => {
            // 1. Ambil Paket Data Lengkap dari Server
            const response = await Utils.fetchSetoranData(); 
            
            // Cek jika ada error atau data kosong
            if (!response || !response.setoran) {
                console.error("Gagal format data server");
                return;
            }

            // 2. Simpan Data Santri dari Sheet ke State
            State.rawSantriList = (response.santri || []).map(s => ({
                id: s.ID || s.id, 
                nama: s.Nama || s.NamaSantri || s.nama, 
                kelas: s.Kelas || s.kelas,
                program: s.Program || s.program,
                musyrif: s.Musyrif || s.musyrif
            }));

            // Buat Map Nama -> ID (untuk pencarian cepat)
            State.santriNameMap = new Map(State.rawSantriList.map(s => [Utils.normalizeName(s.nama), s.id]));

            // 3. Simpan Data Setoran
            State.allSetoran = response.setoran.map(item => ({
                id: `row-${item.rowNumber}`,
                santriId: State.santriNameMap.get(Utils.normalizeName(item.namaSantri || '')) || null,
                createdAt: item.tanggal, 
                ...item
            }));

            // 4. Hitung Statistik & Render
            Core.calculateSantriStats();
            Core.buildClassGroups();
            UI.renderAll();
            
            // 5. Update dropdown musyrif (Panggil fungsinya)
            Core.updateMusyrifList(); 
        },

        calculateSantriStats: () => {
            const santriStatsMap = new Map(State.rawSantriList.map(s => [s.id, { ...s, mutqinJuz: new Set(), nilai: 0, nilaiTampil: 0, isTuntas: false, tuntasDate: null, ziyadahPages: 0, unggulanPages: 0, setoran: [], setoranCount: 0 }]));
            
            for (const setoran of State.allSetoran) {
                if (santriStatsMap.has(setoran.santriId)) {
                    const santri = santriStatsMap.get(setoran.santriId);
                    santri.setoran.push(setoran);
                    santri.setoranCount++;
                }
            }
            
            santriStatsMap.forEach(santri => {
                if (santri.setoran.length === 0) return;

                const mutqinSetengahJuz = santri.setoran.find(s => s.jenis === 'Mutqin' && String(s.juz) === "juz30_setengah" && new Date(s.createdAt) <= AppConfig.deadlineJuz30Score);
                const mutqinJuz30 = santri.setoran.find(s => s.jenis === 'Mutqin' && s.juz == 30 && (!s.halaman || parseInt(s.halaman) >= AppConfig.hafalanData.juzPageCounts['30']));
                const mutqinJuz29 = santri.setoran.find(s => s.jenis === 'Mutqin' && s.juz == 29 && (!s.halaman || parseInt(s.halaman) >= AppConfig.hafalanData.juzPageCounts['29']));

                if (mutqinJuz29) santri.mutqinJuz.add(29);
                if (mutqinJuz30) santri.mutqinJuz.add(30);

                if (mutqinSetengahJuz || (mutqinJuz30 && new Date(mutqinJuz30.createdAt) <= AppConfig.deadlineJuz30Score)) {
                    santri.nilai = 100;
                } else {
                    santri.nilai = santri.setoran
                        .filter(s => s.jenis === 'Mutqin' && new Date(s.createdAt) > AppConfig.deadlineJuz30Score)
                        .reduce((sum, s) => {
                            const pageCount = parseFloat(s.halaman) || AppConfig.hafalanData.juzPageCounts[s.juz] || 0;
                            return sum + pageCount;
                        }, 0);
                }

                let tuntas = false;
                if (santri.program === 'Unggulan' && santri.nilai >= 100) {
                    tuntas = true;
                } else if (santri.program === 'Tahfizh') {
                    const deadlineMet = (mutqinJuz29 && new Date(mutqinJuz29.createdAt) <= AppConfig.deadlineTahfizhTuntas) && (mutqinJuz30 && new Date(mutqinJuz30.createdAt) <= AppConfig.deadlineTahfizhTuntas);
                    if (santri.nilai >= 100 && santri.mutqinJuz.has(29) && santri.mutqinJuz.has(30) && deadlineMet) {
                        tuntas = true;
                    }
                }
                
                if (tuntas) {
                    santri.isTuntas = true;
                    let completionDates = [];
                    if (mutqinSetengahJuz) completionDates.push(new Date(mutqinSetengahJuz.createdAt));
                    if (mutqinJuz30) completionDates.push(new Date(mutqinJuz30.createdAt));
                    if (mutqinJuz29) completionDates.push(new Date(mutqinJuz29.createdAt));
                    if (completionDates.length > 0) {
                        santri.tuntasDate = new Date(Math.max(...completionDates));
                        santri.setoran.forEach(setoran => {
                            if (new Date(setoran.createdAt) > santri.tuntasDate) {
                                const pageValue = (setoran.halaman ? parseFloat(setoran.halaman) : AppConfig.hafalanData.surahData[setoran.juz]?.pages[setoran.surat]) || 0;
                                if (setoran.jenis === 'Ziyadah') {
                                    santri.ziyadahPages += pageValue;
                                }
                            }
                        });
                    }
                }
                santri.nilaiTampil = Math.min(100, santri.nilai);
                santri.unggulanPages = santri.setoran.reduce((sum, s) => {
                    let pageCount = 0;
                    if (s.halaman) {
                        pageCount = parseFloat(s.halaman);
                    } else if (s.juz === 'juz30_setengah') {
                        pageCount = AppConfig.hafalanData.juzPageCounts['juz30_setengah'];
                    } else if (AppConfig.hafalanData.surahData[s.juz] && AppConfig.hafalanData.surahData[s.juz].pages[s.surat]) {
                        pageCount = AppConfig.hafalanData.surahData[s.juz].pages[s.surat];
                    } else if (s.jenis === 'Mutqin' && AppConfig.hafalanData.juzPageCounts[s.juz]) {
                        pageCount = AppConfig.hafalanData.juzPageCounts[s.juz];
                    }
                    return sum + pageCount;
                }, 0);
            });
            State.santriData = Array.from(santriStatsMap.values());
        },

        buildClassGroups: () => {
            const tempGroups = {};
            State.santriData.forEach(s => {
                if (!tempGroups[s.musyrif]) {
                    tempGroups[s.musyrif] = { santri: [], musyrif: s.musyrif, classes: new Set() };
                }
                tempGroups[s.musyrif].santri.push(s);
                tempGroups[s.musyrif].classes.add(s.kelas);
            });

            State.classGroups = {};
            for (const musyrif in tempGroups) {
                const group = tempGroups[musyrif];
                const groupName = (musyrif === 'Muhammad Zhafir Setiaji') ? '2CDGH' : [...group.classes].sort().join(', ');
                State.classGroups[groupName] = { santri: group.santri, musyrif: group.musyrif };
            }
            State.classGroups['Khusus Tahfizh'] = { santri: State.santriData.filter(s => s.program === 'Tahfizh'), musyrif: 'Semua Musyrif' };
            State.classGroups['Seluruh Santri'] = { santri: State.santriData, musyrif: 'Semua Musyrif' };
        },

        updateMusyrifList: () => {
             const musyrifSet = new Set(State.rawSantriList.map(s => s.musyrif).filter(Boolean));
             const musyrifList = [...musyrifSet].sort();
             Utils.populateSelect(DOM.musyrif, musyrifList, 'Pilih Musyrif');
        }
    };

    function validateForm() {
        let isValid = true;
        document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
        
        const requiredFields = [
            { id: 'tanggal', message: 'Tanggal tidak boleh kosong.' },
            { id: 'musyrif', message: 'Musyrif harus dipilih.' },
            { id: 'namaSantri', message: 'Nama santri harus dipilih.' },
            { id: 'jenis', message: 'Jenis setoran harus dipilih.' },
            { id: 'juz', message: 'Juz harus dipilih.' }
        ];

        requiredFields.forEach(field => {
            const input = DOM[field.id.replace(/-(\w)/g, (_, p1) => p1.toUpperCase())];
            if (!input.value) {
                const errorEl = input.nextElementSibling;
                if (errorEl && errorEl.classList.contains('form-error')) {
                    errorEl.textContent = field.message;
                    errorEl.style.display = 'block';
                }
                isValid = false;
            }
        });

        if (DOM.halaman.required && !DOM.halaman.value) {
            DOM.halaman.nextElementSibling.style.display = 'block';
            isValid = false;
        }
        if (DOM.surat.required && !DOM.surat.value) {
            DOM.surat.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        return isValid;
    }

    async function main() {
        cacheDOMElements();
        setupEventListeners();
        UI.switchPage('page-beranda');

        UI.updateDateTime();
        setInterval(UI.updateDateTime, 1000);

        // State.santriNameMap akan diisi di Core.reloadData()
        
        // Populate musyrif dropdown awal bisa kosong, nanti diupdate setelah data load
        // Tapi kita bisa isi list musyrif default dari config jika mau
        // Untuk sekarang biarkan kosong atau Loading...
        
        await Core.reloadData();
        
        UI.switchPage('page-beranda', false);
    }

    // Panggil fungsi setup event listeners
    function setupEventListeners() {
        DOM.setoranForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm()) return;

            const btn = DOM.submitButton;
            btn.disabled = true;
            DOM.submitButtonText.textContent = 'Menyimpan...';
            DOM.submitButtonIcon.classList.add('hidden');
            DOM.submitSpinner.classList.remove('hidden');
            
            const formData = new FormData(e.target);
            formData.set('namaSantri', DOM.namaSantri.options[DOM.namaSantri.selectedIndex].text);
            
            const data = await Utils.postData(formData);
            if (data.result === 'success') {
                UI.showToast('Setoran berhasil disimpan!');
                e.target.reset();
                DOM.namaSantri.dispatchEvent(new Event('change'));
                await Core.reloadData();
            }
            btn.disabled = false;
            DOM.submitButtonText.textContent = 'Simpan Setoran';
            DOM.submitButtonIcon.classList.remove('hidden');
            DOM.submitSpinner.classList.add('hidden');
        });

        DOM.nowBtn.addEventListener('click', () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            DOM.tanggal.value = now.toISOString().slice(0, 16);
        });

        DOM.mainNav.addEventListener('click', e => {
            const link = e.target.closest('.nav-link');
            if (link) {
                e.preventDefault();
                UI.switchPage(link.dataset.page);
            }
        });

        DOM.mainContent.addEventListener('click', e => {
            const button = e.target.closest('.export-pdf-btn, .delete-btn, [data-target-page], .accordion-button, .sortable, .tab-peringkat, .tahfizh-tab');
            if (!button) return;

            if (button.matches('.export-pdf-btn')) {
                UI.exportRecapToPDF(button.dataset.classGroup);
            } else if (button.matches('.delete-btn')) {
                State.setoranIdToDelete = button.dataset.id;
                DOM.passwordConfirmModal.classList.remove('hidden');
            } else if (button.matches('[data-target-page]')) {
                UI.switchPage(button.dataset.targetPage);
            } else if (button.matches('.accordion-button')) {
                const panel = button.closest('h2').nextElementSibling;
                panel.style.maxHeight = panel.style.maxHeight ? null : `${panel.scrollHeight}px`;
                button.querySelector('.accordion-chevron').classList.toggle('rotate-180');
            } else if (button.matches('.sortable')) {
                const column = button.dataset.sort;
                const groupName = Object.keys(State.classGroups).find(n => n.replace(/, /g, '').replace(/ /g, '-') === button.closest('.rekap-tab-content').id.replace('rekap-tab-', ''));
                if (groupName) {
                    const group = State.classGroups[groupName];
                    const isSameColumn = group.sortState?.column === column;
                    group.sortState = {
                        column: column,
                        dir: isSameColumn && group.sortState?.dir === 'asc' ? 'desc' : 'asc'
                    };
                    UI.renderSingleRekapTable(groupName);
                }
            } else if (button.matches('.tab-peringkat')) {
                document.querySelectorAll('.tab-peringkat').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                UI.renderPeringkatContent(button.dataset.program);
            } else if (button.matches('.tahfizh-tab')) {
                document.querySelectorAll('.tahfizh-tab').forEach(b => b.classList.remove('text-amber-600', 'border-amber-500'));
                button.classList.add('text-amber-600', 'border-amber-500');
                UI.renderTahfizhContent(parseInt(button.dataset.juz, 10));
            }
        });
        
        DOM.mainContent.addEventListener('input', e => {
            if (e.target.matches('.tahfizh-search')) {
                clearTimeout(State.searchDebounceTimer);
                State.searchDebounceTimer = setTimeout(() => {
                    const juz = parseInt(e.target.dataset.juzFilter, 10);
                    UI.renderTahfizhContent(juz, e.target.value);
                }, 300);
            }
        });

        DOM.rekapSelect.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            DOM.rekapContentContainer.querySelectorAll('.rekap-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`rekap-tab-${selectedId}`).classList.remove('hidden');
        });

        DOM.musyrif.addEventListener('change', () => {
            const musyrifValue = DOM.musyrif.value;
            const santriOptions = musyrifValue
                ? State.rawSantriList.filter(s => s.musyrif === musyrifValue).sort((a, b) => a.nama.localeCompare(b.nama)).map(s => ({ text: s.nama, value: s.id }))
                : [];
            Utils.populateSelect(DOM.namaSantri, santriOptions, 'Pilih Santri');
            DOM.namaSantri.disabled = !musyrifValue;
            DOM.namaSantri.dispatchEvent(new Event('change'));
        });

        DOM.namaSantri.addEventListener('change', () => {
            const santri = State.rawSantriList.find(s => s.id === DOM.namaSantri.value);
            // Cari data santri yang sudah diolah (untuk cek status tuntas)
            const santriProcessed = State.santriData.find(s => s.id === DOM.namaSantri.value);
            
            DOM.kelas.value = santri?.kelas || '';
            DOM.program.value = santri?.program || '';
            DOM.santriId.value = santri?.id || '';
            
            const isTuntas = santriProcessed ? santriProcessed.isTuntas : false;
            
            const jenisOptions = santri ? (santri.program === "Unggulan" || (santri.program === "Tahfizh" && isTuntas) ? ["Ziyadah", "Murajaah", "Mutqin"] : ["Murajaah", "Mutqin"]) : [];
            Utils.populateSelect(DOM.jenis, jenisOptions, 'Pilih Jenis');
            DOM.jenis.disabled = !santri;
            DOM.jenis.dispatchEvent(new Event('change'));
        });

        DOM.jenis.addEventListener('change', () => {
            const jenisValue = DOM.jenis.value;
            const santri = State.santriData.find(s => s.id === DOM.namaSantri.value);
            let juzOptions = [];
            if (jenisValue && santri) {
                if (jenisValue === 'Mutqin') {
                    if (!santri.nilai || santri.nilai < 100) juzOptions.push({ text: "Setengah Juz 30", value: "juz30_setengah" });
                    const availableJuz = Object.keys(AppConfig.hafalanData.surahData);
                    availableJuz.forEach(juzNum => {
                        if (!santri.mutqinJuz.has(parseInt(juzNum))) {
                            juzOptions.push({ text: `Juz ${juzNum}`, value: juzNum });
                        }
                    });
                } else {
                    Object.keys(AppConfig.hafalanData.surahData).forEach(juzNum => {
                        juzOptions.push({ text: `Juz ${juzNum}`, value: juzNum });
                    });
                }
            }
            Utils.populateSelect(DOM.juz, juzOptions.sort((a,b) => a.value - b.value), 'Pilih Juz');
            DOM.juz.disabled = !jenisValue;
            DOM.juz.dispatchEvent(new Event('change'));
        });

        DOM.juz.addEventListener('change', () => {
            const jenisValue = DOM.jenis.value;
            const juzValue = DOM.juz.value;
            ['halaman', 'surat'].forEach(key => {
                DOM[`${key}Container`].classList.add('hidden');
                DOM[key].disabled = true;
                DOM[key].required = false;
            });
            if (!jenisValue || !juzValue || juzValue === 'juz30_setengah') return;
            const juzNum = parseInt(juzValue, 10);
            if ((jenisValue === 'Ziyadah' || jenisValue === 'Murajaah') && AppConfig.hafalanData.surahData[juzNum]) {
                DOM.suratContainer.classList.remove('hidden');
                DOM.surat.disabled = false;
                DOM.surat.required = true;
                Utils.populateSelect(DOM.surat, AppConfig.hafalanData.surahData[juzNum].list, 'Pilih Surat');
            } else {
                DOM.halamanContainer.classList.remove('hidden');
                DOM.halaman.disabled = false;
                DOM.halaman.required = jenisValue !== 'Mutqin';
                if (jenisValue === 'Mutqin') DOM.halaman.placeholder = 'Kosongkan u/ 1 Juz';
            }
        });

        [DOM.filterTanggalMulai, DOM.filterTanggalAkhir, DOM.filterProgram, DOM.filterKelas].forEach(el => el.addEventListener('input', UI.renderHistoryTable));
        DOM.searchRiwayat.addEventListener('input', e => {
            clearTimeout(State.searchDebounceTimer);
            State.searchDebounceTimer = setTimeout(() => {
                UI.renderHistoryTable();
                const query = e.target.value;
                if (query.length < 2) {
                    DOM.suggestionsContainer.classList.add('hidden');
                    return;
                }
                const suggestions = State.santriData.filter(s => s.nama.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
                if (suggestions.length > 0) {
                    DOM.suggestionsContainer.innerHTML = suggestions.map(s => `<div class="suggestion-item p-2 hover:bg-[var(--hover-bg)] cursor-pointer">${s.nama}</div>`).join('');
                    DOM.suggestionsContainer.classList.remove('hidden');
                } else {
                    DOM.suggestionsContainer.classList.add('hidden');
                }
            }, 300);
        });
        DOM.suggestionsContainer.addEventListener('click', e => {
            if (e.target.matches('.suggestion-item')) {
                DOM.searchRiwayat.value = e.target.textContent;
                DOM.suggestionsContainer.classList.add('hidden');
                UI.renderHistoryTable();
            }
        });

        DOM.cancelPasswordBtn.addEventListener('click', () => DOM.passwordConfirmModal.classList.add('hidden'));
        DOM.confirmPasswordBtn.addEventListener('click', async () => {
            // 1. Ambil input password dari user
            const inputPass = DOM.passwordInput.value;
            
            // (Opsional) Validasi kosong di client
            if (!inputPass) {
                 DOM.passwordError.textContent = "Masukkan kata sandi.";
                 DOM.passwordError.classList.remove('hidden');
                 return;
            }

            // Reset pesan error
            DOM.passwordError.classList.add('hidden');
            
            const setoran = State.allSetoran.find(s => s.id === State.setoranIdToDelete);
            if (!setoran) return;

            // 2. Beri feedback visual bahwa sedang memproses (Loading)
            const originalText = DOM.confirmPasswordBtn.textContent;
            DOM.confirmPasswordBtn.textContent = "Memverifikasi...";
            DOM.confirmPasswordBtn.disabled = true;
            DOM.cancelPasswordBtn.disabled = true;

            // 3. Siapkan data kiriman
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('rowNumber', setoran.rowNumber);
            formData.append('password', inputPass); // Kirim tebakan password ke server

            try {
                // 4. Kirim ke Google Apps Script
                const data = await Utils.postData(formData);
                
                // 5. Cek Jawaban Server
                if (data.result === 'success') {
                    // SUKSES: Server bilang password benar & data dihapus
                    UI.showToast('Data berhasil dihapus.');
                    DOM.passwordConfirmModal.classList.add('hidden'); // Tutup modal
                    DOM.passwordInput.value = ''; // Bersihkan input
                    await Core.reloadData(); // Refresh data
                } else {
                    // GAGAL: Server bilang error (bisa password salah atau error lain)
                    if (data.error === 'Kata sandi salah.') {
                        // Tampilkan error khusus password di modal (seperti sebelumnya)
                        DOM.passwordError.textContent = "Kata sandi salah.";
                        DOM.passwordError.classList.remove('hidden');
                    } else {
                        // Error lain (misal server down), tutup modal & pakai Toast
                        DOM.passwordConfirmModal.classList.add('hidden');
                        UI.showToast(`Gagal: ${data.error}`, 'error');
                    }
                }
            } catch (error) {
                console.error(error);
                UI.showToast('Terjadi kesalahan koneksi.', 'error');
            } finally {
                // 6. Kembalikan tombol ke kondisi semula (selesai loading)
                DOM.confirmPasswordBtn.textContent = originalText;
                DOM.confirmPasswordBtn.disabled = false;
                DOM.cancelPasswordBtn.disabled = false;
            }
        });
        
        DOM.helpButton.addEventListener('click', () => DOM.helpModal.classList.remove('hidden'));
        DOM.closeHelpModal.addEventListener('click', () => DOM.helpModal.classList.add('hidden'));
        DOM.helpModal.querySelector('.modal-backdrop').addEventListener('click', () => DOM.helpModal.classList.add('hidden'));
    }

    // Jalankan aplikasi
    main();
});

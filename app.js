document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. STATE MANAGEMENT
    // ==========================================
    const State = {
        // Data Utama
        allSetoran: [],         // Semua data mentah (Verified + Pending)
        verifiedSetoran: [],    // Hanya yang Verified (untuk Statistik & Laporan)
        pendingSetoran: [],     // Hanya yang Pending (untuk Inbox Validasi Musyrif)
        
        // Data Santri
        rawSantriList: [],      
        santriData: [],         // Data santri terproses
        classGroups: {},        // Grouping kelas untuk rekap
        
        // Session / Role
        currentRole: null,      // 'musyrif', 'santri', 'wali'
        userPassword: null,     // Menyimpan password musyrif sementara (di memori)
        
        // Utils
        setoranIdToDelete: null,
        searchDebounceTimer: null,
        santriNameMap: new Map(),
        chartInstance: null,
        countdownInterval: null
    };

    // ==========================================
    // 2. DOM CACHING
    // ==========================================
    const DOM = {};

    function cacheDOMElements() {
        const elementMapping = {
            // -- Layout & Navigasi --
            mainLayout: 'main-layout',
            mainNav: 'main-nav',
            mainContent: 'main-content',
            datetimeContainer: 'datetime-container',
            navItemInput: 'nav-item-input', 
            navItemAnalisis: 'nav-item-analisis',
            headerRoleText: 'header-role-text',
            appRoleLabel: 'app-role-label',

            // -- Role Selection Modal --
            roleSelectionModal: 'roleSelectionModal',
            roleButtonsContainer: 'role-buttons',
            musyrifLoginForm: 'musyrif-login-form',
            rolePasswordInput: 'role-password-input',
            roleErrorMsg: 'role-error-msg',
            submitRoleBtn: 'submit-role-btn',
            backRoleBtn: 'back-role-btn',
            btnLogout: 'btn-logout',
            
            // -- Validation Section --
            validationSection: 'validation-section',
            validationContainer: 'validation-container',
            validationCount: 'validation-count',
            
            // -- Form Input --
            setoranForm: 'setoranForm',
            tanggal: 'tanggal',
            nowBtn: 'nowBtn',
            musyrif: 'musyrif',
            namaSantri: 'namaSantri',
            santriId: 'santriId',
            kelas: 'kelas',
            program: 'program',
            jenis: 'jenis',
            juz: 'juz',
            halamanContainer: 'halaman-container',
            halaman: 'halaman',
            suratContainer: 'surat-container',
            surat: 'surat',
            submitButton: 'submit-button',
            submitButtonText: 'submit-button-text',
            submitButtonIcon: 'submit-button-icon',
            submitSpinner: 'submit-spinner',
            formSubtitle: 'form-subtitle',

            // -- Riwayat & Tabel --
            setoranTableBody: 'setoranTableBody',
            historyRowTemplate: 'history-row-template',
            searchRiwayat: 'search-riwayat',
            suggestionsContainer: 'suggestions-container',
            filterTanggalMulai: 'filter-tanggal-mulai',
            filterTanggalAkhir: 'filter-tanggal-akhir',
            filterProgram: 'filter-program',
            filterKelas: 'filter-kelas',

            // -- Statistik Beranda --
            statsSantriAktif: 'stats-santri-aktif',
            statsSantriTuntas: 'stats-santri-tuntas',
            statsSantriBelumTuntas: 'stats-santri-belum-tuntas',

            // -- Visual Progress --
            mutqinJuz29ProgressContainer: 'mutqin-juz29-progress-container',
            mutqinJuz30ProgressContainer: 'mutqin-juz30-progress-container',
            mutqinUnggulanProgressContainer: 'mutqin-unggulan-progress-container',
            mutqinUnggulanCircle: 'mutqin-unggulan-circle',
            mutqinJuz30Circle: 'mutqin-juz30-circle',
            mutqinJuz29Circle: 'mutqin-juz29-circle',
            mutqinUnggulanDetails: 'mutqin-unggulan-details',
            mutqinJuz30Details: 'mutqin-juz30-details',
            mutqinJuz29Details: 'mutqin-juz29-details',

            // -- Sections Lain --
            peringkatSection: 'peringkat-section',
            tuntasTrackingAccordion: 'tuntas-tracking-accordion',
            tahfizhTuntasTrackingSection: 'tahfizh-tuntas-tracking-section',
            jadwalPerpulanganSection: 'jadwal-perpulangan-section',

            // -- Rekap & Analisis --
            rekapSelect: 'rekap-select',
            rekapContentContainer: 'rekap-content-container',
            rekapContentTemplate: 'rekap-content-template',
            santriSelectAnalisis: 'santri-select-analisis',
            analisisContentContainer: 'analisis-content-container',
            analisisDashboardTemplate: 'analisis-dashboard-template',
            analisisPromptTemplate: 'analisis-prompt-template',

            // -- Modal & Templates --
            toast: 'toast',
            toastMessage: 'toast-message',
            toastIcon: 'toast-icon',
            passwordConfirmModal: 'passwordConfirmModal',
            passwordInput: 'passwordInput',
            passwordError: 'passwordError',
            cancelPasswordBtn: 'cancelPasswordBtn',
            confirmPasswordBtn: 'confirmPasswordBtn',
            helpButton: 'help-button',
            helpModal: 'helpModal',
            closeHelpModal: 'closeHelpModal',
            studentDetailModal: 'studentDetailModal',
            closeDetailModal: 'closeDetailModal',
            detailNama: 'detail-nama',
            detailInfo: 'detail-info',
            progressChart: 'progressChart',
            juzVisualContainer: 'juz-visual-container',

            // -- HTML Templates --
            tplJadwalPerpulangan: 'tpl-jadwal-perpulangan',
            tplAccordionItem: 'tpl-accordion-item',
            tplPeringkatSection: 'tpl-peringkat-section',
            tplPeringkatItem: 'tpl-peringkat-item',
            tplTahfizhSection: 'tpl-tahfizh-section',
            tplTahfizhContent: 'tpl-tahfizh-content',
            tplJuzBlock: 'tpl-juz-block',
            tplRekapRow: 'tpl-rekap-row',
            tplValidationItem: 'tpl-validation-item'
        };

        for (const [propName, id] of Object.entries(elementMapping)) {
            const element = document.getElementById(id);
            if (element) DOM[propName] = element;
        }
        
        DOM.pages = document.querySelectorAll('.page-content');
        DOM.skeletonContainers = document.querySelectorAll('.skeleton-container');
    }

    // ==========================================
    // 3. UTILITIES & API
    // ==========================================
    const Utils = {
        fetchSetoranData: async () => {
            try {
                const response = await fetch(AppConfig.scriptURL);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                localStorage.setItem('cachedData', JSON.stringify(data)); 
                return data;
            } catch (error) {
                console.warn('Mengambil data offline dari cache...');
                const cached = localStorage.getItem('cachedData');
                if (cached) return JSON.parse(cached);
                
                UI.showToast('Gagal memuat data (Offline & Cache kosong).', 'error');
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
        },

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

        normalizeName: (name) => {
            return typeof name !== 'string' ? '' : name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
        },

        setText: (element, selector, text) => {
            const el = element.querySelector(selector);
            if (el) el.textContent = text;
        },

        setHTML: (element, selector, html) => {
            const el = element.querySelector(selector);
            if (el) el.innerHTML = html;
        }
    };

    // ==========================================
    // 4. UI MANAGERS
    // ==========================================
    const UI = {
        showToast: (message, type = 'success') => {
            DOM.toastMessage.textContent = message;
            const isSuccess = type === 'success';
            DOM.toastIcon.innerHTML = isSuccess
                ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            DOM.toastIcon.classList.toggle('text-green-400', isSuccess);
            DOM.toastIcon.classList.toggle('text-red-400', !isSuccess);
            
            DOM.toast.classList.remove('opacity-0', 'translate-y-[-20px]');
            setTimeout(() => DOM.toast.classList.add('opacity-0', 'translate-y-[-20px]'), 3000);
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
                DOM.mainNav.querySelectorAll('.nav-link div').forEach(div => div.classList.remove('bg-amber-100', 'text-amber-600'));
                DOM.mainNav.querySelectorAll('.nav-link span').forEach(span => span.classList.remove('text-amber-700'));

                const activeLink = DOM.mainNav.querySelector(`a[data-page="${pageId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    const iconDiv = activeLink.querySelector('div');
                    const textSpan = activeLink.querySelector('span');
                    if(iconDiv) iconDiv.classList.add('bg-amber-100', 'text-amber-600');
                    if(textSpan) textSpan.classList.add('text-amber-700');
                }
            }, 150);
        },

        updateDateTime: () => {
            const now = new Date();
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            const islamicDateOptions = { day: 'numeric', month: 'long', year: 'numeric' };

            DOM.datetimeContainer.innerHTML = `
                <div class="space-y-1">
                    <p class="text-4xl font-black text-slate-800 tracking-tighter">${new Intl.DateTimeFormat('id-ID', timeOptions).format(now).replace(/\./g, ':')}</p>
                    <p class="text-sm font-bold text-amber-600 uppercase tracking-widest">${new Intl.DateTimeFormat('id-ID', dateOptions).format(now)}</p>
                    <p class="text-xs font-medium text-slate-400 font-mono mt-1">${new Intl.DateTimeFormat('id-ID-u-ca-islamic', islamicDateOptions).format(now)}</p>
                </div>`;
        },

        // --- ROLE UI SETUP ---
        applyRoleUI: () => {
            // 1. Reset
            DOM.roleSelectionModal.classList.add('hidden');
            DOM.mainLayout.classList.remove('hidden');
            DOM.navItemInput.classList.remove('hidden');
            DOM.validationSection.classList.add('hidden');
            
            // 2. Adjust based on Role
            if (State.currentRole === 'musyrif') {
                DOM.headerRoleText.textContent = 'Dashboard Musyrif';
                DOM.appRoleLabel.textContent = 'Mode Admin';
                // Tampilkan Inbox Validasi jika ada data pending
                if (State.pendingSetoran.length > 0) {
                    DOM.validationSection.classList.remove('hidden');
                    UI.renderValidationInbox();
                }
            } else if (State.currentRole === 'santri') {
                DOM.headerRoleText.textContent = 'Dashboard Santri';
                DOM.appRoleLabel.textContent = 'Mode Santri';
                DOM.formSubtitle.textContent = 'Data akan diverifikasi oleh Musyrif.';
                DOM.submitButtonText.textContent = 'Kirim untuk Validasi';
                // Sembunyikan elemen sensitif
                document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.add('hidden'));
            } else if (State.currentRole === 'wali') {
                DOM.headerRoleText.textContent = 'Dashboard Wali';
                DOM.appRoleLabel.textContent = 'Mode Pemantau';
                // Sembunyikan menu input & analisis dalam
                DOM.navItemInput.classList.add('hidden');
                document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.add('hidden'));
                // Redirect jika sedang di halaman form
                UI.switchPage('page-beranda', false); 
            }
        },

        renderValidationInbox: () => {
            const container = DOM.validationContainer;
            container.innerHTML = '';
            DOM.validationCount.textContent = State.pendingSetoran.length;

            if (State.pendingSetoran.length === 0) {
                DOM.validationSection.classList.add('hidden');
                return;
            }

            State.pendingSetoran.forEach(s => {
                const clone = DOM.tplValidationItem.content.cloneNode(true);
                Utils.setText(clone, '.val-nama', s.namaSantri);
                Utils.setText(clone, '.val-info', `${s.program} - ${s.kelas}`);
                
                const detail = `${s.jenis} • ${s.juz === 'juz30_setengah' ? '1/2 Juz 30' : 'Juz '+s.juz} • ${s.halaman ? s.halaman+' hlm' : s.surat}`;
                Utils.setText(clone, '.val-detail', detail);
                Utils.setText(clone, '.val-date', new Date(s.createdAt).toLocaleString('id-ID'));

                const btnApprove = clone.querySelector('.btn-approve');
                const btnReject = clone.querySelector('.btn-reject');
                
                btnApprove.dataset.id = s.rowNumber;
                btnReject.dataset.id = s.rowNumber;

                // Event Listeners langsung di sini
                btnApprove.addEventListener('click', () => Core.handleValidation(s.rowNumber, 'Verified'));
                btnReject.addEventListener('click', () => Core.handleValidation(s.rowNumber, 'Rejected'));

                container.appendChild(clone);
            });
        },

        renderAll: () => {
            UI.renderBeranda();
            UI.renderValidationInbox(); // Pastikan inbox dirender ulang
            UI.renderHistoryTable();
            UI.renderRekap();
            UI.renderAnalisisPage();
            
            // Re-apply role restrictions (e.g. hide delete buttons in history)
            if (State.currentRole !== 'musyrif') {
                document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.add('hidden'));
            }
        },

        renderBeranda: () => {
            // Statistik hanya hitung data verified
            const santriAktifIds = new Set(State.verifiedSetoran.map(s => s.santriId));
            const totalSantri = State.rawSantriList.length;
            const tuntasCount = State.santriData.filter(s => s.isTuntas).length;

            DOM.statsSantriAktif.textContent = `${santriAktifIds.size} / ${totalSantri}`;
            DOM.statsSantriTuntas.textContent = tuntasCount;
            DOM.statsSantriBelumTuntas.textContent = totalSantri - tuntasCount;

            UI.renderJadwalPerpulangan();
            UI.renderMutqinProgress();
            UI.renderTuntasTracking();
            UI.renderPeringkatNew();
            UI.renderTahfizhTuntasTrackingNew();
        },

        renderJadwalPerpulangan: () => {
            if (State.countdownInterval) clearInterval(State.countdownInterval);
            const now = new Date();
            const nextPeriod = AppConfig.perpulanganPeriods.find(p => now < p.deadline);
            DOM.jadwalPerpulanganSection.innerHTML = '';
            
            const template = DOM.tplJadwalPerpulangan.content.cloneNode(true);
            DOM.jadwalPerpulanganSection.appendChild(template);
            const cont = DOM.jadwalPerpulanganSection.querySelector('#jadwal-content-container');
            
            if (nextPeriod) {
                const monthName = nextPeriod.deadline.toLocaleString('id-ID', { month: 'long' });
                const deadlineStr = nextPeriod.deadline.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const targetsHtml = nextPeriod.required.map(t => `<div class="flex items-center gap-2 bg-white/80 py-1.5 px-3 rounded-full text-xs font-bold shadow-sm border border-slate-200/80 text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg><span>${t.replace(/_/g, ' ')}</span></div>`).join('');
                
                cont.innerHTML = `
                    <div class="glass-card rounded-2xl p-6 bg-gradient-to-br from-white to-slate-50 border border-white/60">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div class="text-center">
                                <h4 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Menuju Perpulangan</h4>
                                <h2 class="text-2xl font-black text-slate-800 mb-2">${monthName}</h2>
                                <p class="text-xs text-slate-500 mb-6 bg-slate-100 inline-block px-3 py-1 rounded-lg">Deadline: ${deadlineStr} WIB</p>
                                <div id="countdown-timer" class="flex justify-center gap-3 text-center"></div>
                            </div>
                            <div class="border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="bg-green-100 text-green-700 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                    </div>
                                    <h4 class="text-sm font-bold text-slate-700">Syarat Hafalan</h4>
                                </div>
                                <div class="flex flex-wrap gap-2">${targetsHtml}</div>
                            </div>
                        </div>
                    </div>`;
                
                const timerEl = cont.querySelector('#countdown-timer');
                const updateCountdown = () => {
                    const nowMs = new Date().getTime();
                    const dist = nextPeriod.deadline.getTime() - nowMs;
                    if (dist < 0) {
                        timerEl.innerHTML = '<p class="font-bold text-lg text-red-500 bg-red-50 px-4 py-2 rounded-xl">Waktu Habis</p>';
                        clearInterval(State.countdownInterval);
                        return;
                    }
                    const d = Math.floor(dist / 864e5), h = Math.floor(dist % 864e5 / 36e5), m = Math.floor(dist % 36e5 / 6e4), s = Math.floor(dist % 6e4 / 1e3);
                    timerEl.innerHTML = [d, h, m, s].map((val, i) => `
                        <div class="bg-white border border-slate-200 p-2 rounded-xl w-16 shadow-sm">
                            <div class="text-2xl font-black text-slate-800">${String(val).padStart(2, '0')}</div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${['Hari', 'Jam', 'Mnt', 'Dtk'][i]}</div>
                        </div>`).join('');
                };
                State.countdownInterval = setInterval(updateCountdown, 1000);
                updateCountdown();
            } else {
                cont.innerHTML = '<div class="glass-card rounded-2xl p-6 text-center font-bold text-slate-400 border-2 border-dashed border-slate-200">Semua jadwal perpulangan telah selesai.</div>';
            }
        },

        renderMutqinProgress: () => {
            const createProgress = (container, circleEl, detailsEl, santriList, color, checkFn) => {
                if (!container) return;
                if (santriList.length > 0) {
                    container.classList.remove('hidden');
                    const tuntasCount = santriList.filter(checkFn).length;
                    const pct = Math.round((tuntasCount / santriList.length) * 100);
                    const radius = 45, circumference = 2 * Math.PI * radius;
                    const offset = circumference - (pct / 100) * circumference;
                    
                    circleEl.innerHTML = `
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle class="text-slate-100" stroke-width="8" stroke="currentColor" fill="transparent" r="${radius}" cx="50" cy="50" />
                            <circle class="progress-ring-circle ${color} transition-all duration-1000 ease-out" stroke-width="8" stroke-linecap="round" stroke="currentColor" fill="transparent" r="${radius}" cx="50" cy="50" style="stroke-dasharray:${circumference};stroke-dashoffset:${circumference};" />
                        </svg>
                        <span class="absolute inset-0 flex items-center justify-center text-3xl font-black ${color}">${pct}%</span>`;
                    setTimeout(() => { const circle = circleEl.querySelector('.progress-ring-circle'); if(circle) circle.style.strokeDashoffset = offset; }, 100);
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
                
                const clone = DOM.tplAccordionItem.content.cloneNode(true);
                Utils.setText(clone, '.data-group-name', groupName);
                Utils.setText(clone, '.data-percentage-text', `${percentage}%`);
                Utils.setText(clone, '.data-tuntas-badge', `Tuntas: ${tuntasCount}`);
                Utils.setText(clone, '.data-belum-badge', `Belum: ${totalCount - tuntasCount}`);
                const bar = clone.querySelector('.data-progress-bar');
                if(bar) bar.style.width = `${percentage}%`;
                const tuntasList = group.santri.filter(s => s.isTuntas).map(s => `<li>${s.nama}</li>`).join('') || '<li class="list-none text-slate-400 italic">Belum ada</li>';
                const belumList = group.santri.filter(s => !s.isTuntas).map(s => `<li>${s.nama}</li>`).join('') || '<li class="list-none text-slate-400 italic">Semua tuntas</li>';
                Utils.setText(clone, '.label-tuntas', `Sudah Tuntas (${tuntasCount})`);
                Utils.setHTML(clone, '.list-tuntas', tuntasList);
                Utils.setText(clone, '.label-belum', `Belum Tuntas (${totalCount - tuntasCount})`);
                Utils.setHTML(clone, '.list-belum', belumList);
                container.appendChild(clone);
            }
        },

        renderPeringkatNew: () => {
            const container = DOM.peringkatSection;
            container.innerHTML = '';
            const clone = DOM.tplPeringkatSection.content.cloneNode(true);
            container.appendChild(clone);
            UI.renderPeringkatContent('Tahfizh');
            const tab = container.querySelector(`[data-program="Tahfizh"]`);
            if(tab) { tab.classList.add('bg-white', 'text-amber-600', 'shadow-sm'); tab.classList.remove('text-slate-500'); }
        },

        renderPeringkatContent: (program) => {
            const contentContainer = document.getElementById('peringkat-content');
            if(!contentContainer) return;
            const santriList = State.santriData.filter(s => s.program === program);
            const getPeringkat = (list, key) => list.sort((a, b) => b[key] - a[key]).slice(0, 5);
            const criteria = program === 'Tahfizh'
                ? [{ key: 'setoranCount', title: 'Paling Rajin (Total Setoran)', unit: 'setoran' }, { key: 'ziyadahPages', title: 'Hafalan Terbanyak (Ziyadah)', unit: 'hlm' }]
                : [{ key: 'setoranCount', title: 'Paling Rajin (Total Setoran)', unit: 'setoran' }, { key: 'unggulanPages', title: 'Hafalan Terbanyak (Halaman)', unit: 'hlm' }];
            const medalColors = ['bg-yellow-400', 'bg-slate-300', 'bg-amber-700'];
            
            contentContainer.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
            criteria.forEach(c => {
                const col = document.createElement('div');
                const title = document.createElement('h4');
                title.className = 'font-bold text-center mb-3 text-slate-700 text-sm uppercase tracking-wide';
                title.textContent = c.title;
                col.appendChild(title);
                const ul = document.createElement('ul');
                ul.className = 'space-y-3';
                const topList = getPeringkat(santriList, c.key);
                if (topList.length > 0) {
                    topList.forEach((s, i) => {
                        const itemClone = DOM.tplPeringkatItem.content.cloneNode(true);
                        const badge = itemClone.querySelector('.medal-bg');
                        badge.textContent = i + 1;
                        badge.classList.add(medalColors[i] || 'bg-slate-200');
                        Utils.setText(itemClone, '.item-nama', s.nama);
                        Utils.setText(itemClone, '.item-kelas', `Kelas ${s.kelas}`);
                        const scoreVal = (s[c.key] || 0).toFixed(['ziyadahPages', 'unggulanPages'].includes(c.key) ? 1 : 0);
                        Utils.setText(itemClone, '.item-score', scoreVal);
                        Utils.setText(itemClone, '.item-unit', c.unit);
                        ul.appendChild(itemClone);
                    });
                } else { ul.innerHTML = '<li class="text-center text-sm text-slate-400 py-4 italic">Belum ada data.</li>'; }
                col.appendChild(ul);
                grid.appendChild(col);
            });
            contentContainer.appendChild(grid);
        },

        renderTahfizhTuntasTrackingNew: () => {
            const container = DOM.tahfizhTuntasTrackingSection;
            container.innerHTML = '';
            const clone = DOM.tplTahfizhSection.content.cloneNode(true);
            container.appendChild(clone);
            UI.renderTahfizhContent(30);
            const tab = container.querySelector(`[data-juz="30"]`);
            if(tab) tab.classList.add('text-amber-600', 'border-amber-500');
        },

        renderTahfizhContent: (juz, searchTerm = '') => {
            const contentContainer = document.getElementById('tahfizh-content');
            const tahfizhSantri = State.santriData.filter(s => s.program === 'Tahfizh');
            if (tahfizhSantri.length === 0) { contentContainer.innerHTML = '<p class="text-center text-slate-500 py-4 italic">Tidak ada santri program Tahfizh.</p>'; return; }
            
            const tuntasCount = tahfizhSantri.filter(s => s.mutqinJuz.has(juz)).length;
            const totalCount = tahfizhSantri.length;
            const percentage = totalCount > 0 ? Math.round((tuntasCount / totalCount) * 100) : 0;
            const lowerSearchTerm = searchTerm.toLowerCase();
            const tuntasList = tahfizhSantri.filter(s => s.mutqinJuz.has(juz) && s.nama.toLowerCase().includes(lowerSearchTerm));
            const belumTuntasList = tahfizhSantri.filter(s => !s.mutqinJuz.has(juz) && s.nama.toLowerCase().includes(lowerSearchTerm));

            contentContainer.innerHTML = '';
            const clone = DOM.tplTahfizhContent.content.cloneNode(true);
            Utils.setText(clone, '.text-progress-label', `Progres: ${tuntasCount} / ${totalCount} Santri`);
            Utils.setText(clone, '.text-percentage', `${percentage}%`);
            const bar = clone.querySelector('.progress-bar');
            if(bar) bar.style.width = `${percentage}%`;
            
            const searchInput = clone.querySelector('.tahfizh-search');
            if(searchInput) { searchInput.setAttribute('data-juz-filter', juz); searchInput.value = searchTerm; }
            Utils.setText(clone, '.count-tuntas', tuntasList.length);
            Utils.setText(clone, '.count-belum', belumTuntasList.length);
            const listTuntasEl = clone.querySelector('.list-tuntas');
            listTuntasEl.innerHTML = tuntasList.map(s => `<li>- ${s.nama}</li>`).join('') || '<li class="text-slate-400 italic">Tidak ada</li>';
            const listBelumEl = clone.querySelector('.list-belum');
            listBelumEl.innerHTML = belumTuntasList.map(s => `<li>- ${s.nama}</li>`).join('') || '<li class="text-slate-400 italic">Semua tuntas</li>';
            contentContainer.appendChild(clone);
        },

        renderHistoryTable: () => {
            const searchTerm = DOM.searchRiwayat.value.toLowerCase();
            const programFilter = DOM.filterProgram.value;
            const classFilter = DOM.filterKelas.value;
            const startDate = DOM.filterTanggalMulai.value ? new Date(DOM.filterTanggalMulai.value) : null;
            const endDate = DOM.filterTanggalAkhir.value ? new Date(DOM.filterTanggalAkhir.value) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            // Filter logic: Musyrif lihat semua, Wali/Santri lihat Verified saja (atau semua untuk santri tapi ada badge)
            // Di sini kita biarkan Wali/Santri melihat status Pending juga untuk transparansi
            const filtered = State.allSetoran
                .filter(setoran => {
                    const santri = State.santriData.find(st => st.id === setoran.santriId);
                    const classMatch = (classFilter === 'Semua') || (santri && (classFilter === '2CDGH' ? ['2C', '2D', '2G', '2H'].includes(santri.kelas) : santri.kelas === classFilter));
                    const dateMatch = (!startDate || new Date(setoran.createdAt) >= startDate) && (!endDate || new Date(setoran.createdAt) <= endDate);
                    const programMatch = (programFilter === 'Semua' || (santri && santri.program === programFilter));
                    const searchMatch = setoran.namaSantri.toLowerCase().includes(searchTerm);
                    
                    // Filter Khusus Wali: Hanya Verified (Opsional, saat ini semua ditampilkan)
                    // if (State.currentRole === 'wali' && setoran.status !== 'Verified') return false;

                    return searchMatch && programMatch && classMatch && dateMatch;
                })
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 50);

            const tableBody = DOM.setoranTableBody;
            tableBody.innerHTML = '';
            if (filtered.length === 0) { tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-slate-500 italic">Tidak ada data yang cocok dengan filter.</td></tr>`; return; }

            const fragment = document.createDocumentFragment();
            filtered.forEach(setoran => {
                const santri = State.santriData.find(s => s.id === setoran.santriId);
                const clone = DOM.historyRowTemplate.content.cloneNode(true);
                
                Utils.setText(clone, '.data-nama', setoran.namaSantri);
                Utils.setText(clone, '.data-jenis', setoran.jenis);
                Utils.setText(clone, '.data-juz-text', String(setoran.juz) === "juz30_setengah" ? "Setengah Juz 30" : `Juz ${setoran.juz}`);
                Utils.setText(clone, '.data-unit', setoran.halaman ? `${setoran.halaman} hlm` : setoran.surat);
                // Utils.setText(clone, '.data-tanggal', new Date(setoran.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }));
                
                const dateContainer = clone.querySelector('.data-tanggal');
                if (dateContainer) {
                    dateContainer.innerHTML = new Date(setoran.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
                }

                // Status Badge Logic
                const statusEl = clone.querySelector('.data-status');
                if (setoran.status === 'Pending') {
                    statusEl.innerHTML = `<span class="badge-pending text-[10px] px-2 py-0.5 rounded-full font-bold">Menunggu Validasi</span>`;
                } else {
                    // Verified: Tidak perlu badge atau badge hijau kecil
                    // statusEl.innerHTML = `<span class="badge-verified text-[10px] px-2 py-0.5 rounded-full font-bold">Terverifikasi</span>`;
                }

                const deleteBtn = clone.querySelector('.delete-btn');
                const actionCell = clone.querySelector('.action-cell');
                if(deleteBtn) {
                    deleteBtn.dataset.id = setoran.id;
                    // Sembunyikan tombol hapus jika bukan Musyrif
                    if (State.currentRole !== 'musyrif') {
                        deleteBtn.classList.add('hidden');
                        if (actionCell) actionCell.classList.add('hidden'); // Sembunyikan kolom aksi jika semua isinya tersembunyi
                    } else {
                        deleteBtn.classList.remove('hidden');
                        if (actionCell) actionCell.classList.remove('hidden');
                    }
                }
                
                if (santri) {
                    const pIcon = clone.querySelector('.data-program-icon');
                    if(pIcon) pIcon.innerHTML = santri.program === 'Unggulan' 
                        ? `<span title="Unggulan" class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">U</span>` 
                        : `<span title="Tahfizh" class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">T</span>`;
                    const cIcon = clone.querySelector('.data-kelas-icon');
                    if(cIcon) {
                        let cl = 'bg-slate-200 text-slate-700'; 
                        const i = santri.kelas.charAt(1); 
                        if (['A'].includes(i)) cl = 'bg-red-100 text-red-700'; if (['B'].includes(i)) cl = 'bg-amber-100 text-amber-700'; if (['C', 'D'].includes(i)) cl = 'bg-emerald-100 text-emerald-700'; if (['G', 'H'].includes(i)) cl = 'bg-blue-100 text-blue-700'; 
                        cIcon.innerHTML = `<span title="Kelas ${santri.kelas}" class="inline-flex items-center justify-center h-5 w-5 rounded-full ${cl} text-[10px] font-bold">${santri.kelas}</span>`;
                    }
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
                
                const clone = DOM.rekapContentTemplate.content.cloneNode(true);
                const content = clone.querySelector('.rekap-tab-content');
                content.id = `rekap-tab-${tabId}`;
                const group = State.classGroups[groupName];
                Utils.setText(clone, '.data-title', `Rekap Capaian - ${groupName}`);
                Utils.setText(clone, '.data-musyrif', `Musyrif: ${group.musyrif}`);
                Utils.setText(clone, '.data-timestamp', new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }));
                const btn = clone.querySelector('.export-pdf-btn');
                if(btn) btn.dataset.classGroup = groupName;
                if (index !== 0) { content.classList.add('hidden'); }
                contentContainer.appendChild(content); 
                UI.renderSingleRekapTable(groupName, { isInitial: true });
            });
        },

        renderSingleRekapTable: (groupName, options = {}) => {
            const group = State.classGroups[groupName]; if (!group) return;
            const contentDiv = document.getElementById(`rekap-tab-${groupName.replace(/, /g, '').replace(/ /g, '-')}`); if (!contentDiv) return;
            if (options.isInitial && !group.sortState) { group.sortState = { column: 'nama', dir: 'asc' }; }
            const { column, dir } = group.sortState;
            group.santri.sort((a, b) => { 
                let valA, valB;
                switch (column) { case 'nama': valA = a.nama; valB = b.nama; break; case 'nilai': valA = a.nilaiTampil; valB = b.nilaiTampil; break; case 'ziyadah': valA = a.program === 'Tahfizh' ? a.ziyadahPages : -1; valB = b.program === 'Tahfizh' ? b.ziyadahPages : -1; break; case 'keterangan': valA = a.isTuntas; valB = b.isTuntas; break; default: return 0; }
                if (valA < valB) return dir === 'asc' ? -1 : 1; if (valA > valB) return dir === 'asc' ? 1 : -1; return 0;
            });
            contentDiv.querySelectorAll('th.sortable').forEach(th => {
                th.removeAttribute('data-sort-dir');
                const iconSpan = th.querySelector('.sort-icon');
                if(iconSpan) iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 12L3 8m4 8l4-8" /></svg>`;
                if (th.dataset.sort === column) { th.setAttribute('data-sort-dir', dir); if(iconSpan) { iconSpan.innerHTML = dir === 'asc' ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>`; } }
            });
            const tableBody = contentDiv.querySelector('.data-table-body');
            tableBody.innerHTML = '';
            const fragment = document.createDocumentFragment();
            group.santri.forEach((santri, idx) => {
                const row = DOM.tplRekapRow.content.cloneNode(true);
                Utils.setText(row, '.col-no', idx + 1);
                const btnDetail = row.querySelector('.detail-santri-btn');
                if(btnDetail) { btnDetail.textContent = santri.nama; btnDetail.dataset.id = santri.id; }
                Utils.setText(row, '.col-nilai', santri.nilaiTampil);
                Utils.setText(row, '.col-ziyadah', santri.program === 'Tahfizh' ? (santri.ziyadahPages || 0).toFixed(1) : '-');
                const statusCell = row.querySelector('.col-status');
                statusCell.innerHTML = `<span class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${santri.isTuntas ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">${santri.isTuntas ? 'Tuntas' : 'Belum'}</span>`;
                fragment.appendChild(row);
            });
            tableBody.appendChild(fragment);
        },

        exportRecapToPDF: (classGroup) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'pt', 'a4');
                const group = State.classGroups[classGroup];
                if (!group) return UI.showToast('Grup kelas tidak ditemukan.', 'error');
                
                const head = [['No.', 'Nama Santri', 'Nilai', 'Ziyadah (hlm)', 'Keterangan']];
                const body = group.santri.sort((a, b) => a.nama.localeCompare(b.nama)).map((santri, index) => [
                    index + 1, santri.nama, santri.nilaiTampil, santri.program === 'Tahfizh' ? (santri.ziyadahPages || 0).toFixed(1) : '-', santri.isTuntas ? 'Tuntas' : 'Belum Tuntas'
                ]);
                doc.autoTable({ head, body, theme: 'grid', headStyles: { fillColor: [245, 158, 11] }, styles: { font: 'helvetica', cellPadding: 6, valign: 'middle' }, columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40, halign: 'center' }, 3: { cellWidth: 70, halign: 'center' }, 4: { cellWidth: 80, halign: 'center' } }, didDrawPage: (data) => { doc.setFontSize(18); doc.setTextColor(180, 83, 9); doc.setFont('helvetica', 'bold'); doc.text('Laporan Capaian Tahfizh', data.settings.margin.left, 40); doc.setFontSize(11); doc.setTextColor(60); doc.setFont('helvetica', 'normal'); doc.text(`Kelompok: ${classGroup} | Musyrif: ${group.musyrif}`, data.settings.margin.left, 58); } });
                doc.save(`rekap_${classGroup.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`);
            } catch (error) { UI.showToast('Gagal mengekspor PDF.', 'error'); }
        },

        openDetailModal: (santriId) => {
            const santri = State.santriData.find(s => s.id === santriId);
            if (!santri) return;
            DOM.detailNama.textContent = santri.nama;
            DOM.detailInfo.textContent = `${santri.kelas} - ${santri.program} | Musyrif: ${santri.musyrif}`;
            UI.renderChart(santri);
            UI.renderJuzBlocks(santri);
            DOM.studentDetailModal.classList.remove('hidden');
        },
    
        renderChart: (santri) => {
            const ctx = DOM.progressChart.getContext('2d');
            if (State.chartInstance) State.chartInstance.destroy();
            const monthlyData = {};
            // Gunakan hanya data Verified untuk chart pribadi
            const validSetoran = santri.setoran.filter(s => s.status !== 'Pending'); 
            const sortedSetoran = [...validSetoran].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            sortedSetoran.forEach(s => {
                const date = new Date(s.createdAt);
                const monthKey = date.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
                let pages = parseFloat(s.halaman) || 0;
                if (!s.halaman && s.surat && AppConfig.hafalanData.surahData[s.juz]) { pages = AppConfig.hafalanData.surahData[s.juz].pages[s.surat] || 0; }
                if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
                monthlyData[monthKey] += pages;
            });
            const labels = Object.keys(monthlyData);
            let accumulator = 0;
            const dataPoints = Object.values(monthlyData).map(val => { accumulator += val; return accumulator.toFixed(1); });
            State.chartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Total Halaman', data: dataPoints, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension: 0.4, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        },
    
        renderJuzBlocks: (santri) => {
            const container = DOM.juzVisualContainer;
            container.innerHTML = '';
            const targetJuzs = [30, 29, 28, 1]; 
            targetJuzs.forEach(juzNum => {
                const setoranJuz = santri.setoran.filter(s => s.juz == juzNum && s.status !== 'Pending'); // Filter Pending
                let totalPagesDone = 0;
                setoranJuz.forEach(s => {
                    if (s.jenis === 'Mutqin') { totalPagesDone = 20; } else { let pages = parseFloat(s.halaman) || 0; if (!pages && s.surat) { pages = AppConfig.hafalanData.surahData[juzNum]?.pages[s.surat] || 0; } totalPagesDone += pages; }
                });
                const maxPages = 20;
                const filledBlocks = Math.min(Math.floor(totalPagesDone), maxPages);
                const percentage = Math.min(Math.round((totalPagesDone / maxPages) * 100), 100);
                const clone = DOM.tplJuzBlock.content.cloneNode(true);
                Utils.setText(clone, '.block-title', `Juz ${juzNum}`);
                Utils.setText(clone, '.block-stats', `${totalPagesDone.toFixed(1)} / 20 Hlm (${percentage}%)`);
                const grid = clone.querySelector('.block-grid');
                grid.innerHTML = Array(20).fill(0).map((_, i) => { const colorClass = i < filledBlocks ? 'bg-green-500 shadow-sm' : 'bg-slate-200'; return `<div class="h-6 rounded-sm ${colorClass} transition-all duration-300 hover:scale-110" title="Halaman ${i+1}"></div>`; }).join('');
                container.appendChild(clone);
            });
        },

        renderAnalisisPage: () => {
            if (!DOM.santriSelectAnalisis) return;
            const opts = State.santriData.sort((a, b) => a.nama.localeCompare(b.nama)).map(s => ({ text: s.nama, value: s.id }));
            Utils.populateSelect(DOM.santriSelectAnalisis, opts, 'Pilih nama santri...');
            DOM.analisisContentContainer.innerHTML = '';
            DOM.analisisContentContainer.appendChild(DOM.analisisPromptTemplate.content.cloneNode(true));
        },

        renderSantriDashboard: (sId) => {
            const s = State.santriData.find(s => s.id === sId);
            if (!s) return;
            DOM.analisisContentContainer.innerHTML = '';
            const dash = DOM.analisisDashboardTemplate.content.cloneNode(true);
            Utils.setText(dash, '[data-name]', s.nama);
            Utils.setHTML(dash, '[data-kelas-text]', `<span>🏫</span> Kelas ${s.kelas}`);
            Utils.setHTML(dash, '[data-program-text]', `<span>📖</span> ${s.program}`);
            const statusBadge = dash.querySelector('[data-status-badge]');
            statusBadge.textContent = s.isTuntas ? 'Tuntas' : 'Proses';
            statusBadge.className = `text-sm font-bold px-4 py-1.5 rounded-full inline-block shadow-sm ${s.isTuntas ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`;
            const perpulanganBadge = dash.querySelector('[data-perpulangan-badge]');
            if (s.statusPerpulangan === 'Boleh Pulang') { perpulanganBadge.textContent = 'Boleh Pulang'; perpulanganBadge.className = 'text-sm font-bold px-4 py-1.5 rounded-full inline-block shadow-sm bg-green-100 text-green-700'; } else { perpulanganBadge.textContent = 'Belum'; perpulanganBadge.className = 'text-sm font-bold px-4 py-1.5 rounded-full inline-block shadow-sm bg-red-100 text-red-700'; }
            Utils.setText(dash, '[data-nilai]', s.nilaiTampil);
            Utils.setText(dash, '[data-ziyadah]', s.program === 'Tahfizh' ? `${(s.ziyadahPages || 0).toFixed(1)}` : '-');
            Utils.setText(dash, '[data-total-setoran]', s.setoranCount);
            const progItems = [{ juz: 'Setengah Juz 30', done: s.nilai >= 100 }, { juz: 'Mutqin Juz 30', done: s.mutqinJuz.has(30), tahfizhOnly: true }, { juz: 'Mutqin Juz 29', done: s.mutqinJuz.has(29), tahfizhOnly: true }];
            const progresHtml = progItems.filter(item => !item.tahfizhOnly || s.program === 'Tahfizh').map(item => `
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span class="font-bold text-sm text-slate-700">${item.juz}</span>
                        ${item.done ? '<span class="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500 text-white uppercase tracking-wider">Selesai</span>' : '<span class="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 text-slate-500 uppercase tracking-wider">Proses</span>'}
                    </div>`).join('');
            Utils.setHTML(dash, '[data-progres-juz]', progresHtml);
            const ziyadahSect = dash.querySelector('[data-ziyadah-section]');
            if (s.program === 'Tahfizh' && s.isTuntas) {
                ziyadahSect.classList.remove('hidden');
                const ziyadahCont = dash.querySelector('[data-progres-ziyadah]');
                const allJuz = Object.keys(AppConfig.hafalanData.juzPageCounts).filter(j => !['juz30_setengah', '30', '29'].includes(j));
                ziyadahCont.innerHTML = allJuz.map(j => { const compPages = s.ziyadahProgress[j] || 0; if (compPages <= 0) return ''; const totalPages = AppConfig.hafalanData.juzPageCounts[j]; const pct = totalPages > 0 ? Math.min(100, (compPages / totalPages) * 100).toFixed(0) : 0; return `<div class="mb-3"><div class="flex justify-between mb-1 text-xs font-bold text-slate-600"><span>Juz ${j}</span><span>${compPages.toFixed(1)} / ${totalPages}</span></div><div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div></div></div>`; }).join('');
            }
            const aktivitasCont = dash.querySelector('[data-aktivitas-terkini]');
            const allActivities = [...s.setoran].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            aktivitasCont.innerHTML = allActivities.length > 0 ? allActivities.map(s => `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4">
                            <p class="font-bold text-sm text-slate-800">${s.jenis} <span class="font-normal text-slate-500 mx-1">•</span> ${String(s.juz) === 'juz30_setengah' ? '1/2 Juz 30' : `Juz ${s.juz}`}</p>
                            <p class="text-xs text-slate-400 font-mono mt-0.5">${s.halaman ? `${s.halaman} hlm` : s.surat}</p>
                        </td>
                        <td class="p-4 text-right text-xs font-bold text-slate-400">
                            ${new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            ${s.status === 'Pending' ? '<span class="block text-amber-500 mt-1">Pending</span>' : ''}
                        </td>
                    </tr>`).join('') : '<tr><td class="p-8 text-center text-slate-400 font-medium text-sm">Belum ada aktivitas.</td></tr>';
            DOM.analisisContentContainer.appendChild(dash);
        }
    };

    // ==========================================
    // 5. CORE LOGIC (BUSINESS LOGIC)
    // ==========================================
    const Core = {
        reloadData: async () => {
            const response = await Utils.fetchSetoranData(); 
            if (!response || !response.setoran) { console.error("Format data server tidak valid."); return; }
            
            // Raw Processing
            State.rawSantriList = (response.santri || []).map(s => ({
                id: s.ID || s.id, nama: s.Nama || s.NamaSantri || s.nama, kelas: s.Kelas || s.kelas, program: s.Program || s.program, musyrif: s.Musyrif || s.musyrif
            }));
            State.santriNameMap = new Map(State.rawSantriList.map(s => [Utils.normalizeName(s.nama), s.id]));
            
            // Split Data: All, Verified, Pending
            State.allSetoran = response.setoran.map(item => ({
                id: `row-${item.rowNumber}`,
                santriId: State.santriNameMap.get(Utils.normalizeName(item.namaSantri || '')) || null,
                createdAt: item.tanggal, 
                rowNumber: item.rowNumber,
                status: item.Status || 'Verified', // Default Verified jika kolom kosong
                ...item
            }));
            
            State.verifiedSetoran = State.allSetoran.filter(s => s.status === 'Verified');
            State.pendingSetoran = State.allSetoran.filter(s => s.status === 'Pending');

            Core.calculateSantriStats();
            Core.buildClassGroups();
            UI.renderAll();
            UI.applyRoleUI(); // Re-apply role logic after reload
            Core.updateMusyrifList(); 
        },

        handleValidation: async (rowNumber, status) => {
            const formData = new FormData();
            formData.append('action', 'validate');
            formData.append('password', State.userPassword);
            formData.append('rowNumber', rowNumber);
            formData.append('status', status);

            // Optimistic Update UI
            const item = DOM.validationContainer.querySelector(`button[data-id="${rowNumber}"]`)?.closest('div');
            if (item) item.remove();
            
            // Update State
            State.pendingSetoran = State.pendingSetoran.filter(s => s.rowNumber != rowNumber);
            DOM.validationCount.textContent = State.pendingSetoran.length;
            if (State.pendingSetoran.length === 0) DOM.validationSection.classList.add('hidden');

            const res = await Utils.postData(formData);
            if (res.result !== 'success') {
                UI.showToast(`Gagal memvalidasi: ${res.error}`, 'error');
                await Core.reloadData(); // Rollback
            } else {
                UI.showToast(status === 'Verified' ? 'Data diterima.' : 'Data ditolak.');
                await Core.reloadData(); 
            }
        },

        checkPerpulanganStatus: (s) => {
            const validSetoran = s.setoran.filter(st => st.status === 'Verified');
            const hasMutqinSetengahJuz = validSetoran.some(set => set.jenis === 'Mutqin' && String(set.juz) === "juz30_setengah");
            if (hasMutqinSetengahJuz) return 'Boleh Pulang';
            const hasMutqinJuz30 = validSetoran.some(set => set.jenis === 'Mutqin' && set.juz == 30);
            if (hasMutqinJuz30) return 'Boleh Pulang';
            const now = new Date();
            let latestAchievedPeriod = null;
            if (AppConfig.perpulanganPeriods) {
                for (const period of AppConfig.perpulanganPeriods) {
                    let conditionMet = false;
                    if (period.type === 'surat') { conditionMet = period.required.every(requiredSurah => validSetoran.some(set => set.surat === requiredSurah && new Date(set.createdAt) <= period.deadline)); } 
                    else if (period.type === 'mutqin') { conditionMet = validSetoran.some(set => set.jenis === 'Mutqin' && period.required.includes(String(set.juz)) && new Date(set.createdAt) <= period.deadline); }
                    if (conditionMet) { latestAchievedPeriod = period; }
                }
            }
            if (latestAchievedPeriod) { const resetDate = new Date(latestAchievedPeriod.deadline); resetDate.setDate(resetDate.getDate() + 1); if (now < resetDate) { return 'Boleh Pulang'; } }
            return 'Belum Boleh Pulang';
        },

        calculateSantriStats: () => {
            const santriStatsMap = new Map(State.rawSantriList.map(s => [s.id, { 
                ...s, mutqinJuz: new Set(), nilai: 0, nilaiTampil: 0, isTuntas: false, tuntasDate: null, ziyadahPages: 0, unggulanPages: 0, setoran: [], setoranCount: 0, ziyadahProgress: {}, statusPerpulangan: 'Belum Boleh Pulang'
            }]));
            
            for (const setoran of State.allSetoran) {
                if (santriStatsMap.has(setoran.santriId)) {
                    const santri = santriStatsMap.get(setoran.santriId);
                    santri.setoran.push(setoran);
                }
            }
            
            santriStatsMap.forEach(santri => {
                const validSetoran = santri.setoran.filter(s => s.status === 'Verified');
                santri.setoranCount = validSetoran.length;

                if (validSetoran.length === 0) return;

                const mutqinSetengahJuz = validSetoran.find(s => s.jenis === 'Mutqin' && String(s.juz) === "juz30_setengah" && new Date(s.createdAt) <= AppConfig.deadlineJuz30Score);
                const mutqinJuz30 = validSetoran.find(s => s.jenis === 'Mutqin' && s.juz == 30 && (!s.halaman || parseInt(s.halaman) >= AppConfig.hafalanData.juzPageCounts['30']));
                const mutqinJuz29 = validSetoran.find(s => s.jenis === 'Mutqin' && s.juz == 29 && (!s.halaman || parseInt(s.halaman) >= AppConfig.hafalanData.juzPageCounts['29']));

                if (mutqinJuz29) santri.mutqinJuz.add(29);
                if (mutqinJuz30) santri.mutqinJuz.add(30);

                if (mutqinSetengahJuz || (mutqinJuz30 && new Date(mutqinJuz30.createdAt) <= AppConfig.deadlineJuz30Score)) {
                    santri.nilai = 100;
                } else {
                    const setoranSurahs = new Set(validSetoran.filter(set => set.juz == 30 && set.surat).map(set => set.surat));
                    let score = 0;
                    if (AppConfig.scoringTiers) { for (const tier of AppConfig.scoringTiers) { if (tier.required.every(surah => setoranSurahs.has(surah))) { score = tier.score; break; } } }
                    if (score === 0) { score = validSetoran.filter(s => s.jenis === 'Mutqin' && new Date(s.createdAt) > AppConfig.deadlineJuz30Score).reduce((sum, s) => { const pageCount = parseFloat(s.halaman) || AppConfig.hafalanData.juzPageCounts[s.juz] || 0; return sum + pageCount; }, 0); }
                    santri.nilai = score;
                }

                let tuntas = false;
                if (santri.program === 'Unggulan' && santri.nilai >= 100) { tuntas = true; } 
                // ... di dalam loop santriStatsMap.forEach ...

                else if (santri.program === 'Tahfizh') {
                    // HAPUS atau KOMENTARI logika deadlineMet yang ketat ini
                    /* const deadlineMet = (mutqinJuz29 && new Date(mutqinJuz29.createdAt) <= AppConfig.deadlineTahfizhTuntas) && 
                                        (mutqinJuz30 && new Date(mutqinJuz30.createdAt) <= AppConfig.deadlineTahfizhTuntas);
                    */
                
                    // Ganti kondisi IF menjadi lebih sederhana:
                    // Cukup cek apakah Juz 29 dan 30 sudah ada (has) dan nilai Juz 30 cukup
                    if (santri.nilai >= 100 && santri.mutqinJuz.has(29) && santri.mutqinJuz.has(30)) { 
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
                        validSetoran.forEach(setoran => {
                            if (new Date(setoran.createdAt) > santri.tuntasDate) {
                                const pageValue = (setoran.halaman ? parseFloat(setoran.halaman) : AppConfig.hafalanData.surahData[setoran.juz]?.pages[setoran.surat]) || 0;
                                if (setoran.jenis === 'Ziyadah') { santri.ziyadahPages += pageValue; santri.ziyadahProgress[setoran.juz] = (santri.ziyadahProgress[setoran.juz] || 0) + pageValue; }
                            }
                        });
                    }
                }
                santri.nilaiTampil = Math.min(100, santri.nilai);
                santri.unggulanPages = validSetoran.reduce((sum, s) => { let pageCount = 0; if (s.halaman) pageCount = parseFloat(s.halaman); else if (s.juz === 'juz30_setengah') pageCount = AppConfig.hafalanData.juzPageCounts['juz30_setengah']; else if (AppConfig.hafalanData.surahData[s.juz] && AppConfig.hafalanData.surahData[s.juz].pages[s.surat]) pageCount = AppConfig.hafalanData.surahData[s.juz].pages[s.surat]; else if (s.jenis === 'Mutqin' && AppConfig.hafalanData.juzPageCounts[s.juz]) pageCount = AppConfig.hafalanData.juzPageCounts[s.juz]; return sum + pageCount; }, 0);
                santri.statusPerpulangan = Core.checkPerpulanganStatus(santri);
            });
            State.santriData = Array.from(santriStatsMap.values());
        },

        buildClassGroups: () => {
            const tempGroups = {};
            State.santriData.forEach(s => {
                if (!tempGroups[s.musyrif]) { tempGroups[s.musyrif] = { santri: [], musyrif: s.musyrif, classes: new Set() }; }
                tempGroups[s.musyrif].santri.push(s);
                tempGroups[s.musyrif].classes.add(s.kelas);
            });
            State.classGroups = {};
            for (const musyrif in tempGroups) {
                const group = tempGroups[musyrif];
                let groupName;
                if (AppConfig.classGroupOverrides && AppConfig.classGroupOverrides[musyrif]) { groupName = AppConfig.classGroupOverrides[musyrif]; } else { groupName = [...group.classes].sort().join(', '); }
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

    // ==========================================
    // 6. EVENT LISTENERS
    // ==========================================
    function setupEventListeners() {
        // --- ROLE SELECTION (Tidak Berubah) ---
        DOM.roleButtonsContainer.addEventListener('click', e => {
            const btn = e.target.closest('.role-btn');
            if (!btn) return;
            const role = btn.dataset.role;
            
            DOM.roleButtonsContainer.classList.remove('hidden');
            DOM.musyrifLoginForm.classList.add('hidden');

            if (role === 'musyrif') {
                DOM.roleButtonsContainer.classList.add('hidden');
                DOM.musyrifLoginForm.classList.remove('hidden');
                DOM.rolePasswordInput.focus();
            } else {
                State.currentRole = role;
                UI.applyRoleUI();
                UI.renderAll();
            }
        });

        DOM.backRoleBtn.addEventListener('click', () => {
            DOM.musyrifLoginForm.classList.add('hidden');
            DOM.roleButtonsContainer.classList.remove('hidden');
            DOM.roleErrorMsg.classList.add('hidden');
            DOM.rolePasswordInput.value = '';
        });

        DOM.submitRoleBtn.addEventListener('click', async () => {
            const pass = DOM.rolePasswordInput.value;
            if (!pass) {
                DOM.roleErrorMsg.textContent = 'Password harus diisi.';
                DOM.roleErrorMsg.classList.remove('hidden');
                return;
            }
            State.userPassword = pass;
            State.currentRole = 'musyrif';
            UI.applyRoleUI();
            UI.renderAll();
        });

        DOM.btnLogout.addEventListener('click', () => {
            State.currentRole = null;
            State.userPassword = null;
            DOM.mainLayout.classList.add('hidden');
            DOM.roleSelectionModal.classList.remove('hidden');
            DOM.rolePasswordInput.value = '';
            DOM.musyrifLoginForm.classList.add('hidden');
            DOM.roleButtonsContainer.classList.remove('hidden');
        });

        // --- FORM HANDLING (Tidak Berubah) ---
        DOM.setoranForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm()) return;

            const btn = DOM.submitButton;
            btn.disabled = true;
            DOM.submitButtonText.textContent = 'Mengirim...';
            DOM.submitButtonIcon.classList.add('hidden');
            DOM.submitSpinner.classList.remove('hidden');
            
            const formData = new FormData(e.target);
            formData.set('namaSantri', DOM.namaSantri.options[DOM.namaSantri.selectedIndex].text);
            
            if (State.currentRole === 'musyrif' && State.userPassword) {
                formData.append('password', State.userPassword);
            }

            const data = await Utils.postData(formData);
            if (data.result === 'success') {
                if (data.status === 'Verified') {
                    UI.showToast('Setoran berhasil disimpan & terverifikasi!');
                } else {
                    UI.showToast('Setoran dikirim. Menunggu validasi Musyrif.', 'success');
                }
                e.target.reset();
                DOM.namaSantri.dispatchEvent(new Event('change'));
                await Core.reloadData();
            } else {
                UI.showToast(`Gagal: ${data.error}`, 'error');
            }
            
            btn.disabled = false;
            DOM.submitButtonText.textContent = State.currentRole === 'musyrif' ? 'Simpan Setoran' : 'Kirim untuk Validasi';
            DOM.submitButtonIcon.classList.remove('hidden');
            DOM.submitSpinner.classList.add('hidden');
        });

        // --- Navigation (Tidak Berubah) ---
        DOM.nowBtn.addEventListener('click', () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            DOM.tanggal.value = now.toISOString().slice(0, 16);
        });

        DOM.mainNav.addEventListener('click', e => {
            const link = e.target.closest('.nav-link');
            if (link) { e.preventDefault(); UI.switchPage(link.dataset.page); }
        });

        // --- Event Delegation (BAGIAN INI DIPERBAIKI) ---
        DOM.mainContent.addEventListener('click', e => {
            const button = e.target.closest('.export-pdf-btn, .delete-btn, [data-target-page], .accordion-button, .sortable, .tab-peringkat, .tahfizh-tab');
            const tabBtn = e.target.closest('.analisis-tab');

            if (button && button.matches('[data-target-page]')) { UI.switchPage(button.dataset.targetPage); return; }

            // -----------------------------------------------------
            // PERBAIKAN 2: TAB ANALISIS (AKTIF/TIDAK AKTIF)
            // -----------------------------------------------------
            if (tabBtn) {
                const targetId = tabBtn.dataset.target;
                // Pastikan selector parent mengambil container yang benar (biasanya div flex)
                const parent = tabBtn.parentElement; 
                
                // Reset SEMUA tab di container ini
                parent.querySelectorAll('.analisis-tab').forEach(t => {
                    // Hapus style aktif
                    t.classList.remove('active', 'bg-white', 'text-amber-600', 'shadow-sm');
                    // Tambahkan style inaktif (supaya terlihat abu-abu/redup)
                    t.classList.add('text-slate-500', 'hover:bg-slate-50'); 
                });

                // Set tab yang diklik jadi AKTIF
                tabBtn.classList.remove('text-slate-500', 'hover:bg-slate-50'); // Hapus style inaktif
                tabBtn.classList.add('active', 'bg-white', 'text-amber-600', 'shadow-sm'); // Tambah style aktif

                // Switch Content
                DOM.analisisContentContainer.querySelectorAll('.analisis-tab-content').forEach(c => c.classList.add('hidden'));
                const targetPanel = DOM.analisisContentContainer.querySelector(`#${targetId}`);
                if(targetPanel) targetPanel.classList.remove('hidden');
                return;
            }

            if (!button) return;

            if (button.matches('.export-pdf-btn')) { 
                UI.exportRecapToPDF(button.dataset.classGroup); 
            } 
            else if (button.matches('.delete-btn')) { 
                State.setoranIdToDelete = button.dataset.id; 
                DOM.passwordConfirmModal.classList.remove('hidden'); 
            } 
            // -----------------------------------------------------
            // PERBAIKAN 1: AKORDEON (LOGIKA BUKA/TUTUP)
            // -----------------------------------------------------
            else if (button.matches('.accordion-button')) { 
                // Menggunakan parentElement untuk fallback jika tidak dibungkus <h2>
                const headerContainer = button.closest('h2') || button.parentElement;
                const panel = headerContainer.nextElementSibling; 
                
                if (panel) {
                    const chevron = button.querySelector('.accordion-chevron');
                    
                    // Cek apakah sedang terbuka (maxHeight ada nilainya)
                    if (panel.style.maxHeight) {
                        // Jika terbuka -> TUTUP
                        panel.style.maxHeight = null;
                        if(chevron) chevron.classList.remove('rotate-180');
                    } else {
                        // Jika tertutup -> BUKA
                        panel.style.maxHeight = `${panel.scrollHeight}px`;
                        if(chevron) chevron.classList.add('rotate-180');
                    }
                }
            } 
            else if (button.matches('.sortable')) {
                const column = button.dataset.sort;
                const tabContent = button.closest('.rekap-tab-content');
                const groupName = Object.keys(State.classGroups).find(n => n.replace(/, /g, '').replace(/ /g, '-') === tabContent.id.replace('rekap-tab-', ''));
                if (groupName) { const group = State.classGroups[groupName]; const isSameColumn = group.sortState?.column === column; group.sortState = { column: column, dir: isSameColumn && group.sortState?.dir === 'asc' ? 'desc' : 'asc' }; UI.renderSingleRekapTable(groupName); }
            } else if (button.matches('.tab-peringkat')) {
                const container = DOM.peringkatSection;
                container.querySelectorAll('.tab-peringkat').forEach(b => { b.classList.remove('bg-white', 'text-amber-600', 'shadow-sm'); b.classList.add('text-slate-500'); });
                button.classList.add('bg-white', 'text-amber-600', 'shadow-sm'); button.classList.remove('text-slate-500'); UI.renderPeringkatContent(button.dataset.program);
            } else if (button.matches('.tahfizh-tab')) {
                const container = DOM.tahfizhTuntasTrackingSection;
                container.querySelectorAll('.tahfizh-tab').forEach(b => b.classList.remove('text-amber-600', 'border-amber-500'));
                button.classList.add('text-amber-600', 'border-amber-500'); UI.renderTahfizhContent(parseInt(button.dataset.juz, 10));
            }
        });
        
        DOM.mainContent.addEventListener('input', e => { if (e.target.matches('.tahfizh-search')) { clearTimeout(State.searchDebounceTimer); State.searchDebounceTimer = setTimeout(() => { const juz = parseInt(e.target.dataset.juzFilter, 10); UI.renderTahfizhContent(juz, e.target.value); }, 300); } });

        if (DOM.santriSelectAnalisis) { DOM.santriSelectAnalisis.addEventListener('change', (e) => { if (e.target.value) { UI.renderSantriDashboard(e.target.value); } else { DOM.analisisContentContainer.innerHTML = ''; DOM.analisisContentContainer.appendChild(DOM.analisisPromptTemplate.content.cloneNode(true)); } }); }

        DOM.rekapSelect.addEventListener('change', (e) => { const selectedId = e.target.value; DOM.rekapContentContainer.querySelectorAll('.rekap-tab-content').forEach(c => c.classList.add('hidden')); document.getElementById(`rekap-tab-${selectedId}`).classList.remove('hidden'); });
        DOM.rekapContentContainer.addEventListener('click', e => { if (e.target.matches('.detail-santri-btn')) { UI.openDetailModal(e.target.dataset.id); } });
        DOM.closeDetailModal.addEventListener('click', () => DOM.studentDetailModal.classList.add('hidden'));
        DOM.studentDetailModal.querySelector('.modal-backdrop').addEventListener('click', () => DOM.studentDetailModal.classList.add('hidden'));

        // -- Form Dependency & Filter/Search & Delete (Tidak Berubah) --
        DOM.musyrif.addEventListener('change', () => { const musyrifValue = DOM.musyrif.value; const santriOptions = musyrifValue ? State.rawSantriList.filter(s => s.musyrif === musyrifValue).sort((a, b) => a.nama.localeCompare(b.nama)).map(s => ({ text: s.nama, value: s.id })) : []; Utils.populateSelect(DOM.namaSantri, santriOptions, 'Pilih Santri'); DOM.namaSantri.disabled = !musyrifValue; DOM.namaSantri.dispatchEvent(new Event('change')); });
        DOM.namaSantri.addEventListener('change', () => { const santri = State.rawSantriList.find(s => s.id === DOM.namaSantri.value); const santriProcessed = State.santriData.find(s => s.id === DOM.namaSantri.value); DOM.kelas.value = santri?.kelas || ''; DOM.program.value = santri?.program || ''; DOM.santriId.value = santri?.id || ''; const isTuntas = santriProcessed ? santriProcessed.isTuntas : false; const jenisOptions = santri ? (santri.program === "Unggulan" || (santri.program === "Tahfizh" && isTuntas) ? ["Ziyadah", "Murajaah", "Mutqin"] : ["Murajaah", "Mutqin"]) : []; Utils.populateSelect(DOM.jenis, jenisOptions, 'Pilih Jenis'); DOM.jenis.disabled = !santri; DOM.jenis.dispatchEvent(new Event('change')); });
        DOM.jenis.addEventListener('change', () => { const jenisValue = DOM.jenis.value; const santri = State.santriData.find(s => s.id === DOM.namaSantri.value); let juzOptions = []; if (jenisValue && santri) { if (jenisValue === 'Mutqin') { if (!santri.nilai || santri.nilai < 100) juzOptions.push({ text: "Setengah Juz 30", value: "juz30_setengah" }); const availableJuz = Object.keys(AppConfig.hafalanData.surahData); availableJuz.forEach(juzNum => { if (!santri.mutqinJuz.has(parseInt(juzNum))) { juzOptions.push({ text: `Juz ${juzNum}`, value: juzNum }); } }); } else { Object.keys(AppConfig.hafalanData.surahData).forEach(juzNum => { juzOptions.push({ text: `Juz ${juzNum}`, value: juzNum }); }); } } Utils.populateSelect(DOM.juz, juzOptions.sort((a,b) => a.value - b.value), 'Pilih Juz'); DOM.juz.disabled = !jenisValue; DOM.juz.dispatchEvent(new Event('change')); });
        DOM.juz.addEventListener('change', () => { const jenisValue = DOM.jenis.value; const juzValue = DOM.juz.value; ['halaman', 'surat'].forEach(key => { DOM[`${key}Container`].classList.add('hidden'); DOM[key].disabled = true; DOM[key].required = false; }); if (!jenisValue || !juzValue || juzValue === 'juz30_setengah') return; const juzNum = parseInt(juzValue, 10); if ((jenisValue === 'Ziyadah' || jenisValue === 'Murajaah') && AppConfig.hafalanData.surahData[juzNum]) { DOM.suratContainer.classList.remove('hidden'); DOM.surat.disabled = false; DOM.surat.required = true; Utils.populateSelect(DOM.surat, AppConfig.hafalanData.surahData[juzNum].list, 'Pilih Surat'); } else { DOM.halamanContainer.classList.remove('hidden'); DOM.halaman.disabled = false; DOM.halaman.required = jenisValue !== 'Mutqin'; if (jenisValue === 'Mutqin') DOM.halaman.placeholder = 'Kosongkan u/ 1 Juz'; } });

        [DOM.filterTanggalMulai, DOM.filterTanggalAkhir, DOM.filterProgram, DOM.filterKelas].forEach(el => el.addEventListener('input', UI.renderHistoryTable));
        DOM.searchRiwayat.addEventListener('input', e => { clearTimeout(State.searchDebounceTimer); State.searchDebounceTimer = setTimeout(() => { UI.renderHistoryTable(); const query = e.target.value; if (query.length < 2) { DOM.suggestionsContainer.classList.add('hidden'); return; } const suggestions = State.santriData.filter(s => s.nama.toLowerCase().includes(query.toLowerCase())).slice(0, 5); if (suggestions.length > 0) { DOM.suggestionsContainer.innerHTML = suggestions.map(s => `<div class="suggestion-item p-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700">${s.nama}</div>`).join(''); DOM.suggestionsContainer.classList.remove('hidden'); } else { DOM.suggestionsContainer.classList.add('hidden'); } }, 300); });
        DOM.suggestionsContainer.addEventListener('click', e => { if (e.target.matches('.suggestion-item')) { DOM.searchRiwayat.value = e.target.textContent; DOM.suggestionsContainer.classList.add('hidden'); UI.renderHistoryTable(); } });

        DOM.cancelPasswordBtn.addEventListener('click', () => DOM.passwordConfirmModal.classList.add('hidden'));
        DOM.confirmPasswordBtn.addEventListener('click', async () => {
            const inputPass = DOM.passwordInput.value;
            if (!inputPass) { DOM.passwordError.textContent = "Masukkan kata sandi."; DOM.passwordError.classList.remove('hidden'); return; }
            DOM.passwordError.classList.add('hidden');
            const setoran = State.allSetoran.find(s => s.id === State.setoranIdToDelete);
            if (!setoran) return;
            const originalText = DOM.confirmPasswordBtn.textContent; DOM.confirmPasswordBtn.textContent = "Memverifikasi..."; DOM.confirmPasswordBtn.disabled = true; DOM.cancelPasswordBtn.disabled = true;
            const formData = new FormData(); formData.append('action', 'delete'); formData.append('rowNumber', setoran.rowNumber); formData.append('password', inputPass);
            try { const data = await Utils.postData(formData); if (data.result === 'success') { UI.showToast('Data berhasil dihapus.'); DOM.passwordConfirmModal.classList.add('hidden'); DOM.passwordInput.value = ''; await Core.reloadData(); } else { if (data.error === 'Kata sandi salah.') { DOM.passwordError.textContent = "Kata sandi salah."; DOM.passwordError.classList.remove('hidden'); } else { DOM.passwordConfirmModal.classList.add('hidden'); UI.showToast(`Gagal: ${data.error}`, 'error'); } } } catch (error) { UI.showToast('Terjadi kesalahan koneksi.', 'error'); } finally { DOM.confirmPasswordBtn.textContent = originalText; DOM.confirmPasswordBtn.disabled = false; DOM.cancelPasswordBtn.disabled = false; }
        });
        
        DOM.helpButton.addEventListener('click', () => DOM.helpModal.classList.remove('hidden'));
        DOM.closeHelpModal.addEventListener('click', () => DOM.helpModal.classList.add('hidden'));
        DOM.helpModal.querySelector('.modal-backdrop').addEventListener('click', () => DOM.helpModal.classList.add('hidden'));
    }
    
    // ==========================================
    // 7. INITIALIZATION
    // ==========================================
    async function main() {
        cacheDOMElements();
        setupEventListeners();
        UI.switchPage('page-beranda');
        UI.updateDateTime();
        setInterval(UI.updateDateTime, 1000);
        
        // 1. Coba ambil data (with loading screen)
        await Core.reloadData();
        
        // 2. Tampilkan Role Selection Modal (sebelum switch page)
        DOM.roleSelectionModal.classList.remove('hidden');
        DOM.mainLayout.classList.add('hidden'); // Sembunyikan main content sampai role dipilih

        // 3. Matikan loading skeleton setelah data dimuat
        UI.switchPage('page-beranda', false); 
    }

    main();
});

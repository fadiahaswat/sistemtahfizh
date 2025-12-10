document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. STATE MANAGEMENT
    // ==========================================
    const State = {
        allSetoran: [],      // Data setoran utama (valid)
        pendingSetoran: [],  // Data setoran menunggu approval
        rawSantriList: [],   // Data master santri
        santriData: [],      // Data santri yang sudah diolah statistik
        classGroups: {},
        isAdmin: false,      // Status login
        adminPassword: '',   // Password sementara (untuk approval session)
        setoranIdToDelete: null,
        searchDebounceTimer: null,
        santriNameMap: new Map(),
        chartInstance: null
    };

    // ==========================================
    // 2. DOM CACHING
    // ==========================================
    const DOM = {};
    function cacheDOMElements() {
        const elementMapping = {
            // -- Layout --
            mainNav: 'main-nav',
            mainContent: 'main-content',
            skeletonLoader: 'skeleton-loader',
            
            // -- Login & Admin Menu --
            loginMusyrifBtn: 'login-musyrif-btn',
            loginModal: 'login-modal',
            adminPasswordInput: 'admin-password-input',
            performLoginBtn: 'perform-login-btn',
            adminMenuItems: 'admin-menu-items',
            logoutBtn: 'logout-btn',
            pendingCountBadge: 'pending-count-badge',
            
            // -- Halaman Approval --
            pageApproval: 'page-approval',
            pendingListContainer: 'pending-list-container',

            // -- Form Input --
            setoranForm: 'setoran-form',
            tanggal: 'tanggal',
            nowBtn: 'now-btn',
            musyrif: 'musyrif',
            namaSantri: 'nama-santri',
            santriId: 'santri-id',
            kelas: 'kelas',
            program: 'program',
            jenis: 'jenis',
            juz: 'juz',
            halamanContainer: 'halaman-container',
            halaman: 'halaman',
            suratContainer: 'surat-container',
            surat: 'surat',
            kualitas: 'kualitas',
            submitButton: 'submit-button',
            submitButtonText: 'submit-button-text',
            submitButtonIcon: 'submit-button-icon',
            submitSpinner: 'submit-spinner',
            inputSubtitle: 'input-subtitle',

            // -- Dashboard & Stats --
            statsSantriAktif: 'stats-santri-aktif',
            statsSantriTuntas: 'stats-santri-tuntas',
            statsSantriBelumTuntas: 'stats-santri-belum-tuntas',
            
            mutqinUnggulanProgressContainer: 'mutqin-unggulan-progress-container',
            mutqinJuz30ProgressContainer: 'mutqin-juz30-progress-container',
            mutqinJuz29ProgressContainer: 'mutqin-juz29-progress-container',
            
            mutqinUnggulanCircle: 'mutqin-unggulan-circle',
            mutqinJuz30Circle: 'mutqin-juz30-circle',
            mutqinJuz29Circle: 'mutqin-juz29-circle',
            
            mutqinUnggulanDetails: 'mutqin-unggulan-details',
            mutqinJuz30Details: 'mutqin-juz30-details',
            mutqinJuz29Details: 'mutqin-juz29-details',
            
            peringkatSection: 'peringkat-section',
            tuntasTrackingAccordion: 'tuntas-tracking-accordion',
            datetimeContainer: 'datetime-container',

            // -- Rekap --
            rekapSelect: 'rekap-select',
            rekapContentContainer: 'rekap-content-container',
            rekapContentTemplate: 'rekap-content-template',

            // -- Modal Detail Santri --
            studentDetailModal: 'student-detail-modal',
            closeDetailModal: 'close-detail-modal',
            detailNama: 'detail-nama',
            detailInfo: 'detail-info',
            progressChart: 'progress-chart',
            juzVisualContainer: 'juz-visual-container',

            // -- Toast --
            toast: 'toast',
            toastMessage: 'toast-message',
            toastIcon: 'toast-icon'
        };

        for (const [propName, id] of Object.entries(elementMapping)) {
            const element = document.getElementById(id);
            if (element) DOM[propName] = element;
        }
        
        DOM.pages = document.querySelectorAll('.page-content');
    }

    // ==========================================
    // 3. UTILITIES & API
    // ==========================================
    const Utils = {
        fetchSetoranData: async () => {
            try {
                const response = await fetch(AppConfig.scriptURL);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Gagal memuat data:', error);
                UI.showToast('Gagal koneksi ke server.', 'error');
                return { setoran: [], santri: [], pending: [] };
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
            if(!selectElement) return;
            selectElement.innerHTML = '';
            if (placeholder) selectElement.add(new Option(placeholder, ''));
            options.forEach(opt => selectElement.add(new Option(opt.text, opt.value)));
        },
        normalizeName: (name) => {
            return typeof name !== 'string' ? '' : name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
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
                ? `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`
                : `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            
            // Reset class
            DOM.toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 py-3 px-5 rounded-lg border shadow-xl backdrop-blur-sm transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none`;
            
            // Apply style based on type
            if(isSuccess) {
                DOM.toast.classList.add('bg-green-900/90', 'border-green-700', 'text-white');
            } else {
                DOM.toast.classList.add('bg-red-900/90', 'border-red-700', 'text-white');
            }

            // Show
            setTimeout(() => {
                DOM.toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
            }, 10);

            // Hide
            setTimeout(() => {
                DOM.toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
            }, 3000);
        },

        switchPage: (pageId) => {
            DOM.pages.forEach(p => p.classList.add('hidden'));
            document.getElementById(pageId)?.classList.remove('hidden');
            
            // Update Active State Nav
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active', 'bg-amber-50', 'text-amber-600'));
            const activeLink = document.querySelector(`a[data-page="${pageId}"]`);
            if(activeLink) activeLink.classList.add('active', 'bg-amber-50', 'text-amber-600');

            // Render content specific
            if(pageId === 'page-approval') {
                UI.renderPendingList();
            }
        },

        updateAdminUI: () => {
            if(State.isAdmin) {
                DOM.loginMusyrifBtn.classList.add('hidden');
                DOM.adminMenuItems.classList.remove('hidden');
                DOM.inputSubtitle.textContent = "Mode Musyrif: Data akan langsung tersimpan ke database utama.";
                
                // Update badge pending
                const pendingCount = State.pendingSetoran.length;
                DOM.pendingCountBadge.textContent = pendingCount;
                if(pendingCount > 0) DOM.pendingCountBadge.classList.remove('hidden');
                else DOM.pendingCountBadge.classList.add('hidden');
            } else {
                DOM.loginMusyrifBtn.classList.remove('hidden');
                DOM.adminMenuItems.classList.add('hidden');
                DOM.inputSubtitle.textContent = "Santri dapat menginput hafalan secara mandiri. Data akan diverifikasi oleh Musyrif.";
            }
        },

        updateDateTime: () => {
            const now = new Date();
            const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            const timeStr = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            const dateStr = now.toLocaleDateString('id-ID', dateOptions);
            
            DOM.datetimeContainer.innerHTML = `${dateStr} • ${timeStr} WIB`;
        },

        renderAll: () => {
            UI.renderBeranda();
            UI.renderRekap();
            UI.updateAdminUI();
        },

        renderBeranda: () => {
            const santriAktifIds = new Set(State.allSetoran.map(s => s.santriId));
            const totalSantri = State.rawSantriList.length;
            const tuntasCount = State.santriData.filter(s => s.isTuntas).length;

            DOM.statsSantriAktif.textContent = `${santriAktifIds.size}/${totalSantri}`;
            DOM.statsSantriTuntas.textContent = tuntasCount;
            DOM.statsSantriBelumTuntas.textContent = totalSantri - tuntasCount;

            // Helper Render Circle
            const renderCircle = (el, circleEl, detailEl, list, check) => {
                const count = list.filter(check).length;
                const pct = list.length ? Math.round((count / list.length) * 100) : 0;
                // SVG Circle Logic simplified for this version
                circleEl.innerHTML = `<svg class="w-full h-full" viewBox="0 0 36 36"><path class="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3"/><path class="${el.id.includes('unggulan') ? 'text-sky-500' : el.id.includes('30') ? 'text-green-500' : 'text-amber-500'}" stroke-dasharray="${pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3" /></svg><div class="absolute inset-0 flex items-center justify-center font-bold text-lg">${pct}%</div>`;
                detailEl.textContent = `${count} dari ${list.length} santri`;
            };

            const unggulan = State.santriData.filter(s => s.program === 'Unggulan');
            const tahfizh = State.santriData.filter(s => s.program === 'Tahfizh');
            
            renderCircle(DOM.mutqinUnggulanProgressContainer, DOM.mutqinUnggulanCircle, DOM.mutqinUnggulanDetails, unggulan, s => s.nilai >= 100);
            renderCircle(DOM.mutqinJuz30ProgressContainer, DOM.mutqinJuz30Circle, DOM.mutqinJuz30Details, tahfizh, s => s.mutqinJuz.has(30));
            renderCircle(DOM.mutqinJuz29ProgressContainer, DOM.mutqinJuz29Circle, DOM.mutqinJuz29Details, tahfizh, s => s.mutqinJuz.has(29));

            // Render Peringkat Simple
            const topSantri = [...State.santriData].sort((a,b) => b.setoranCount - a.setoranCount).slice(0, 5);
            DOM.peringkatSection.innerHTML = `
                <h4 class="font-bold text-gray-700 mb-4">Top 5 Terrajin (Total Setoran)</h4>
                <div class="space-y-3">
                    ${topSantri.map((s, i) => `
                        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <span class="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full font-bold text-sm">${i+1}</span>
                            <div class="flex-1">
                                <p class="font-semibold text-sm">${s.nama}</p>
                                <p class="text-xs text-gray-500">${s.kelas}</p>
                            </div>
                            <span class="font-bold text-gray-700">${s.setoranCount}</span>
                        </div>
                    `).join('')}
                </div>`;
        },

        renderRekap: () => {
            const groups = Object.keys(State.classGroups).sort();
            Utils.populateSelect(DOM.rekapSelect, groups.map(g => ({text: g, value: g})));
            
            DOM.rekapContentContainer.innerHTML = '';
            
            groups.forEach((g, i) => {
                const el = DOM.rekapContentTemplate.content.cloneNode(true).firstElementChild;
                const groupId = g.replace(/[\s,]+/g, '-');
                el.id = `rekap-${groupId}`;
                
                if(i !== 0) el.classList.add('hidden');
                
                el.querySelector('.data-title').textContent = g;
                el.querySelector('.data-musyrif').textContent = State.classGroups[g].musyrif;
                el.querySelector('.export-pdf-btn').dataset.group = g;

                const tbody = el.querySelector('.data-table-body');
                tbody.innerHTML = State.classGroups[g].santri.map((s, idx) => `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-4 py-3 border-b border-gray-100">${idx+1}</td>
                        <td class="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                            <button class="detail-santri-btn hover:text-amber-600 hover:underline text-left w-full" data-id="${s.id}">
                                ${s.nama}
                            </button>
                        </td>
                        <td class="px-4 py-3 border-b border-gray-100 text-center font-semibold text-gray-700">${s.nilaiTampil}</td>
                        <td class="px-4 py-3 border-b border-gray-100 text-center">${s.program === 'Tahfizh' ? s.ziyadahPages.toFixed(1) : '-'}</td>
                        <td class="px-4 py-3 border-b border-gray-100 text-center">
                            <span class="px-2 py-1 rounded-full text-xs font-bold ${s.isTuntas ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                                ${s.isTuntas ? 'Tuntas' : 'Belum'}
                            </span>
                        </td>
                    </tr>
                `).join('');
                
                DOM.rekapContentContainer.appendChild(el);
            });
        },

        renderPendingList: () => {
            const list = State.pendingSetoran;
            const container = DOM.pendingListContainer;
            
            if(list.length === 0) {
                container.innerHTML = `<div class="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">Tidak ada setoran yang menunggu persetujuan.</div>`;
                return;
            }

            container.innerHTML = list.map((item, idx) => `
                <div class="bg-white p-4 rounded-xl border border-l-4 border-l-amber-500 border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-gray-800 text-lg">${item.namaSantri}</span>
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">${item.kelas}</span>
                        </div>
                        <p class="text-sm text-gray-600">
                            <span class="font-semibold text-amber-600">${item.jenis}</span> • 
                            ${String(item.juz) === 'juz30_setengah' ? '1/2 Juz 30' : 'Juz '+item.juz} • 
                            <span class="font-medium text-gray-800">${item.halaman ? item.halaman + ' Hlm' : item.surat}</span>
                        </p>
                        <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ${new Date(item.tanggal).toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div class="flex gap-2 w-full sm:w-auto" data-row-index="${item.rowIndex}">
                        <button class="approve-btn flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Terima
                        </button>
                        <button class="reject-btn flex-1 sm:flex-none bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg> Tolak
                        </button>
                    </div>
                </div>
            `).join('');
        },

        openDetailModal: (id) => {
            const s = State.santriData.find(x => x.id === id);
            if(!s) return;
            
            DOM.detailNama.textContent = s.nama;
            DOM.detailInfo.textContent = `${s.kelas} - ${s.program} | Musyrif: ${s.musyrif}`;
            DOM.studentDetailModal.classList.remove('hidden');
            
            // --- Render Chart ---
            const ctx = DOM.progressChart.getContext('2d');
            if(State.chartInstance) State.chartInstance.destroy();
            
            const dataMap = {};
            // Urutkan setoran
            [...s.setoran].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).forEach(set => {
                const k = new Date(set.createdAt).toLocaleString('id-ID', {month:'short', year:'2-digit'});
                const val = parseFloat(set.halaman) || (set.surat ? 0.5 : 0); // Estimasi surat = 0.5 halaman
                dataMap[k] = (dataMap[k] || 0) + val;
            });

            let acc = 0;
            const labels = Object.keys(dataMap);
            const data = Object.values(dataMap).map(v => { acc += v; return acc.toFixed(1); });
            
            State.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Halaman Hafalan',
                        data: data,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#d97706',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // --- Render Visual Blocks ---
            DOM.juzVisualContainer.innerHTML = '';
            [30, 29, 28, 1].forEach(j => {
                const jSet = s.setoran.filter(x => x.juz == j);
                let done = 0;
                jSet.forEach(x => { 
                    if(x.jenis === 'Mutqin') done = 20; 
                    else done += (parseFloat(x.halaman) || (x.surat ? 0.5 : 0)); 
                });
                
                const blocks = Math.min(Math.floor(done), 20);
                const percent = Math.min(Math.round((done/20)*100), 100);
                
                DOM.juzVisualContainer.innerHTML += `
                    <div class="mb-4">
                        <div class="flex justify-between text-xs mb-1 font-bold text-gray-600">
                            <span>Juz ${j}</span>
                            <span class="${percent === 100 ? 'text-green-600' : 'text-gray-500'}">${done.toFixed(1)} / 20 (${percent}%)</span>
                        </div>
                        <div class="grid grid-cols-10 gap-1">
                            ${Array(20).fill(0).map((_,i) => `
                                <div class="h-5 rounded-sm transition-all duration-300 ${i < blocks ? 'bg-green-500 shadow-sm' : 'bg-gray-100'}"></div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }
    };

    // ==========================================
    // 5. CORE LOGIC
    // ==========================================
    const Core = {
        init: async () => {
            // Tampilkan Skeleton saat loading awal
            if(DOM.skeletonLoader) DOM.skeletonLoader.classList.remove('hidden');
            
            const data = await Utils.fetchSetoranData();
            
            // 1. Process Santri Master
            State.rawSantriList = (data.santri || []).map(s => ({
                id: s.ID || s.id, 
                nama: s.Nama || s.NamaSantri, 
                kelas: s.Kelas, 
                program: s.Program, 
                musyrif: s.Musyrif
            }));
            
            State.santriNameMap = new Map(State.rawSantriList.map(s => [Utils.normalizeName(s.nama), s.id]));

            // 2. Process Setoran Valid
            State.allSetoran = (data.setoran || []).map((item) => ({
                ...item, 
                id: `row-${item.rowNumber}`, 
                santriId: State.santriNameMap.get(Utils.normalizeName(item.namaSantri)), 
                createdAt: item.tanggal
            })).filter(i => i.santriId);

            // 3. Process Pending Setoran
            State.pendingSetoran = data.pending || [];

            // 4. Calculate Stats & Grouping
            Core.calcStats();
            Core.groupClasses();
            
            // 5. Populate Inputs
            const uniqueMusyrif = [...new Set(State.rawSantriList.map(s => s.musyrif))].filter(Boolean).sort();
            Utils.populateSelect(DOM.musyrif, uniqueMusyrif.map(m => ({text: m, value: m})), 'Pilih Musyrif');

            // 6. Render Initial UI
            UI.renderAll();
            
            if(DOM.skeletonLoader) DOM.skeletonLoader.classList.add('hidden');
        },

        calcStats: () => {
            // Init map santri dengan default values
            const map = new Map(State.rawSantriList.map(s => [s.id, {
                ...s, 
                setoran: [], 
                mutqinJuz: new Set(), 
                nilai: 0, 
                nilaiTampil: 0, 
                isTuntas: false, 
                ziyadahPages: 0, 
                setoranCount: 0
            }]));

            // Isi data setoran ke santri
            State.allSetoran.forEach(s => {
                const santri = map.get(s.santriId);
                if(santri) {
                    santri.setoran.push(s);
                    santri.setoranCount++;
                    
                    // Logic Hitung Nilai & Tuntas
                    if(s.jenis === 'Mutqin' && s.juz == 30) santri.mutqinJuz.add(30);
                    if(s.jenis === 'Mutqin' && s.juz == 29) santri.mutqinJuz.add(29);
                    
                    if(String(s.juz) === 'juz30_setengah' && s.jenis === 'Mutqin') {
                        santri.nilai = 100;
                    } else if (s.juz == 30 && s.jenis === 'Mutqin' && (!s.halaman || s.halaman >= 20)) {
                        santri.nilai = 100;
                    }

                    if(s.jenis === 'Ziyadah') {
                        santri.ziyadahPages += (parseFloat(s.halaman) || 0.5);
                    }
                }
            });

            // Finalisasi Status Tuntas
            map.forEach(s => {
                s.nilaiTampil = s.nilai;
                
                const deadlineTahfizh = AppConfig.deadlineTahfizhTuntas || new Date(); // Fallback
                
                const isUnggulanTuntas = s.program === 'Unggulan' && s.nilai >= 100;
                // Logika Tahfizh: Nilai 100 + Mutqin Juz 30 + Mutqin Juz 29
                const isTahfizhTuntas = s.program === 'Tahfizh' && s.nilai >= 100 && s.mutqinJuz.has(30) && s.mutqinJuz.has(29);
                
                s.isTuntas = isUnggulanTuntas || isTahfizhTuntas;
            });

            State.santriData = Array.from(map.values());
        },

        groupClasses: () => {
            const groups = { 
                'Seluruh Santri': { santri: State.santriData, musyrif: 'Semua' }, 
                'Khusus Tahfizh': { santri: State.santriData.filter(s=>s.program==='Tahfizh'), musyrif: 'Semua' } 
            };
            
            State.santriData.forEach(s => {
                const k = s.musyrif || 'Lainnya';
                if(!groups[k]) groups[k] = { santri: [], musyrif: k, classes: new Set() };
                groups[k].santri.push(s);
            });
            
            State.classGroups = groups;
        }
    };

    // ==========================================
    // 6. EVENT LISTENERS SETUP
    // ==========================================
    
    // Login Flow
    DOM.loginMusyrifBtn?.addEventListener('click', () => DOM.loginModal.classList.remove('hidden'));
    
    DOM.performLoginBtn?.addEventListener('click', () => {
        const pass = DOM.adminPasswordInput.value;
        if(pass) {
            State.adminPassword = pass; 
            State.isAdmin = true;
            DOM.loginModal.classList.add('hidden');
            DOM.adminPasswordInput.value = ''; // Clear input for security
            UI.updateAdminUI();
            UI.showToast("Login Berhasil! Menu Admin Terbuka.");
        }
    });

    DOM.loginModal?.addEventListener('click', (e) => {
        if(e.target === DOM.loginModal) DOM.loginModal.classList.add('hidden');
    });

    DOM.logoutBtn?.addEventListener('click', () => {
        State.isAdmin = false;
        State.adminPassword = '';
        UI.updateAdminUI();
        UI.switchPage('page-beranda');
        UI.showToast("Anda telah keluar.");
    });

    // Approval Flow (Event Delegation)
    DOM.pendingListContainer?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;

        const container = btn.closest('[data-row-index]');
        if(!container) return;

        const rowIndex = container.dataset.rowIndex;
        const action = btn.classList.contains('approve-btn') ? 'approve' : 'reject';

        if(!confirm(`Yakin ingin ${action === 'approve' ? 'menerima' : 'menolak'} data ini?`)) return;

        // Visual loading
        btn.disabled = true;
        btn.innerHTML = 'Memproses...';

        const formData = new FormData();
        formData.append('action', action);
        formData.append('rowIndex', rowIndex);
        formData.append('password', State.adminPassword);

        const res = await Utils.postData(formData);
        
        if(res.result === 'success') {
            UI.showToast(`Berhasil: ${action === 'approve' ? 'Disetujui' : 'Ditolak'}`);
            await Core.init(); // Reload all data
        } else {
            UI.showToast(`Gagal: ${res.error}`, 'error');
            btn.disabled = false;
            btn.innerHTML = action === 'approve' ? 'Terima' : 'Tolak';
        }
    });

    // Form Submission
    DOM.submitButton?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if(!DOM.setoranForm.checkValidity()) {
            UI.showToast("Mohon lengkapi formulir.", 'error');
            return;
        }

        const btn = DOM.submitButton;
        const spinner = DOM.submitSpinner;
        const text = DOM.submitButtonText;
        
        btn.disabled = true; 
        spinner.classList.remove('hidden'); 
        text.textContent = 'Mengirim...';

        const formData = new FormData(DOM.setoranForm);
        // Tentukan Aksi: input_mandiri (Santri) vs input_admin (Musyrif)
        formData.append('action', State.isAdmin ? 'input_admin' : 'input_mandiri');
        if(State.isAdmin) formData.append('password', State.adminPassword);
        
        // Tambahkan Nama Santri Text manual (karena select value nya ID)
        const santriName = DOM.namaSantri.options[DOM.namaSantri.selectedIndex].text;
        formData.append('namaSantri', santriName);

        const res = await Utils.postData(formData);
        
        if(res.result === 'success') {
            UI.showToast(State.isAdmin ? 'Data tersimpan!' : 'Terkirim! Menunggu persetujuan Musyrif.');
            DOM.setoranForm.reset();
            // Reset dropdowns
            DOM.namaSantri.innerHTML = '<option>Pilih Musyrif Dulu</option>';
            DOM.namaSantri.disabled = true;
            DOM.jenis.disabled = true;
            DOM.juz.disabled = true;
            
            if(State.isAdmin) await Core.init(); 
        } else {
            UI.showToast(`Gagal: ${res.error}`, 'error');
        }

        btn.disabled = false; 
        spinner.classList.add('hidden'); 
        text.textContent = 'Kirim Setoran';
    });

    // Navigation & Dropdowns
    document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', (e) => {
        e.preventDefault();
        const page = l.dataset.page;
        if(page) UI.switchPage(page);
    }));

    DOM.rekapSelect?.addEventListener('change', (e) => {
        const id = e.target.value.replace(/[\s,]+/g, '-');
        document.querySelectorAll('.rekap-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`rekap-${id}`)?.classList.remove('hidden');
    });

    // Detail Modal Delegation
    DOM.rekapContentContainer?.addEventListener('click', (e) => {
        if(e.target.matches('.detail-santri-btn')) {
            UI.openDetailModal(e.target.dataset.id);
        }
    });

    DOM.closeDetailModal?.addEventListener('click', () => DOM.studentDetailModal.classList.add('hidden'));
    DOM.studentDetailModal?.addEventListener('click', (e) => {
        if(e.target === DOM.studentDetailModal) DOM.studentDetailModal.classList.add('hidden');
    });

    // Dependent Dropdowns
    DOM.musyrif?.addEventListener('change', (e) => {
        const list = State.rawSantriList.filter(s => s.musyrif === e.target.value).sort((a,b)=>a.nama.localeCompare(b.nama));
        Utils.populateSelect(DOM.namaSantri, list.map(s=>({text:s.nama, value:s.id})), 'Pilih Santri');
        DOM.namaSantri.disabled = false;
    });

    DOM.namaSantri?.addEventListener('change', (e) => {
        const s = State.rawSantriList.find(x => x.id === e.target.value);
        if(s) {
            DOM.santriId.value = s.id; DOM.kelas.value = s.kelas; DOM.program.value = s.program;
            const processed = State.santriData.find(x => x.id === s.id);
            const isTuntas = processed ? processed.isTuntas : false;
            const types = (s.program === 'Unggulan' || (s.program === 'Tahfizh' && isTuntas)) ? ['Ziyadah', 'Murajaah', 'Mutqin'] : ['Murajaah', 'Mutqin'];
            Utils.populateSelect(DOM.jenis, types.map(t=>({text:t, value:t})), 'Pilih Jenis');
            DOM.jenis.disabled = false;
        }
    });

    DOM.jenis?.addEventListener('change', (e) => {
        const jList = [];
        const s = State.santriData.find(x => x.id === DOM.namaSantri.value);
        
        if(e.target.value === 'Mutqin') {
            if(!s.nilai || s.nilai < 100) jList.push({text: 'Setengah Juz 30', value: 'juz30_setengah'});
            Object.keys(AppConfig.hafalanData.surahData).forEach(k => {
                if(!s.mutqinJuz.has(parseInt(k))) jList.push({text: 'Juz '+k, value:k});
            });
        } else {
            Object.keys(AppConfig.hafalanData.surahData).forEach(k => jList.push({text: 'Juz '+k, value:k}));
        }
        Utils.populateSelect(DOM.juz, jList, 'Pilih Juz');
        DOM.juz.disabled = false;
    });

    DOM.juz?.addEventListener('change', (e) => {
        const val = e.target.value;
        DOM.halamanContainer.classList.add('hidden'); DOM.suratContainer.classList.add('hidden');
        if(val === 'juz30_setengah') return;
        
        if(['Ziyadah', 'Murajaah'].includes(DOM.jenis.value) && AppConfig.hafalanData.surahData[val]) {
            DOM.suratContainer.classList.remove('hidden');
            Utils.populateSelect(DOM.surat, AppConfig.hafalanData.surahData[val].list.map(s=>({text:s, value:s})), 'Pilih Surat');
        } else {
            DOM.halamanContainer.classList.remove('hidden');
        }
    });

    DOM.nowBtn?.addEventListener('click', () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        DOM.tanggal.value = now.toISOString().slice(0, 16);
    });

    // Start App
    cacheDOMElements();
    UI.updateDateTime();
    setInterval(UI.updateDateTime, 1000);
    Core.init();
});

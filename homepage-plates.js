/* ============================================
   HOMEPAGE PLATE RENDERER
   Uses UAEPlateGenerator to render real plates
   into the listing cards on the homepage.
   ============================================ */

(function () {
    'use strict';

    // ── Listing Data ──────────────────────────────
    // Each entry defines one card on the homepage.
    // Grouped by emirate section in display order.
    const LISTINGS = [
        // Abu Dhabi  (section 0)
        { emirate: 'abudhabi', code: '2', number: '55555', price: 'AED 45,000', priceType: 'bid' },
        { emirate: 'abudhabi', code: '11', number: '1212', price: 'AED 82,500', priceType: 'bid' },
        { emirate: 'abudhabi', code: '5', number: '99', price: 'AED 120,000', priceType: 'fixed' },
        { emirate: 'abudhabi', code: '17', number: '700', price: 'AED 38,000', priceType: 'bid' },

        // Dubai  (section 1)
        { emirate: 'dubai', code: 'A', number: '333', price: 'AED 210,000', priceType: 'bid' },
        { emirate: 'dubai', code: 'W', number: '88', price: 'AED 550,000', priceType: 'bid' },
        { emirate: 'dubai', code: 'AA', number: '10', price: 'AED 3.2M', priceType: 'fixed' },
        { emirate: 'dubai', code: 'R', number: '402', price: 'AED 18,500', priceType: 'bid' },

        // Sharjah  (section 2)
        { emirate: 'sharjah', code: '3', number: '123', price: 'AED 15,000', priceType: 'bid' },
        { emirate: 'sharjah', code: '5', number: '7', price: 'AED 280,000', priceType: 'fixed' },
        { emirate: 'sharjah', code: '1', number: '909', price: 'AED 42,000', priceType: 'bid' },
        { emirate: 'sharjah', code: '2', number: '101', price: 'AED 75,000', priceType: 'fixed' },

        // Ajman  (section 3)
        { emirate: 'ajman', code: 'H', number: '8888', price: 'AED 28,000', priceType: 'bid' },
        { emirate: 'ajman', code: 'B', number: '50', price: 'AED 65,000', priceType: 'fixed' },
        { emirate: 'ajman', code: 'A', number: '999', price: 'AED 33,500', priceType: 'bid' },
        { emirate: 'ajman', code: 'C', number: '1234', price: 'AED 12,000', priceType: 'bid' },

        // Umm Al Quwain  (section 4)
        { emirate: 'umm_al_quwain', code: 'X', number: '77', price: 'AED 45,000', priceType: 'bid' },
        { emirate: 'umm_al_quwain', code: 'I', number: '2020', price: 'AED 32,000', priceType: 'fixed' },
        { emirate: 'umm_al_quwain', code: 'A', number: '9', price: 'AED 195,000', priceType: 'bid' },
        { emirate: 'umm_al_quwain', code: 'B', number: '500', price: 'AED 22,000', priceType: 'bid' },

        // Ras Al Khaimah  (section 5)
        { emirate: 'rak', code: 'V', number: '500', price: 'AED 58,000', priceType: 'bid' },
        { emirate: 'rak', code: 'Y', number: '111', price: 'AED 95,000', priceType: 'fixed' },
        { emirate: 'rak', code: 'K', number: '70', price: 'AED 115,000', priceType: 'bid' },
        { emirate: 'rak', code: 'M', number: '23', price: 'AED 48,000', priceType: 'bid' },

        // Fujairah  (section 6)
        { emirate: 'fujairah', code: 'M', number: '888', price: 'AED 35,000', priceType: 'bid' },
        { emirate: 'fujairah', code: 'C', number: '11', price: 'AED 180,000', priceType: 'fixed' },
        { emirate: 'fujairah', code: 'K', number: '5050', price: 'AED 12,500', priceType: 'bid' },
        { emirate: 'fujairah', code: 'A', number: '300', price: 'AED 25,000', priceType: 'bid' },
    ];

    // ── Template Image Paths ─────────────────────
    const PLATE_TEMPLATES = {
        abudhabi: 'abudhabi-plate.png',
        dubai: 'dubai-plate.png',
        ajman: 'ajman-plate.png',
        rak: 'rak-plate.png',
        fujairah: 'fujariah-plate.png',
        sharjah: 'sharjah-plate.png',
        umm_al_quwain: 'umm-al-q-plate.png'
    };

    // ── Load all template images ─────────────────
    function loadTemplateImages() {
        return new Promise((resolve) => {
            const images = {};
            const keys = Object.keys(PLATE_TEMPLATES);
            let loaded = 0;

            keys.forEach(key => {
                const img = new Image();
                img.onload = () => {
                    images[key] = img;
                    if (++loaded === keys.length) resolve(images);
                };
                img.onerror = () => {
                    console.warn('Failed to load:', PLATE_TEMPLATES[key]);
                    if (++loaded === keys.length) resolve(images);
                };
                img.src = PLATE_TEMPLATES[key];
            });
        });
    }

    // ── Build one card's HTML ─────────────────────
    function buildCard(listing, index) {
        const isBid = listing.priceType === 'bid';
        const priceLabel = isBid ? 'Current Bid' : (listing.priceType === 'fixed' ? 'Fixed Price' : 'Asking Price');
        const btnClass = isBid
            ? 'bg-white text-text-main border border-gray-100 shadow-sm hover:bg-gray-50 hover:scale-105'
            : 'bg-gray-100 text-text-main border border-gray-200 hover:bg-gray-200';
        const btnIcon = isBid ? 'gavel' : 'shopping_cart';

        return `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 group relative">
                <div class="p-4 flex items-center justify-center bg-gray-50 min-h-[130px] relative overflow-hidden">
                    <div id="plate-slot-${index}"
                         class="w-[90%] mx-auto flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                        <div class="animate-pulse bg-gray-200 rounded w-full h-[65px]"></div>
                    </div>
                </div>
                <!-- Reduced padding in footer too for consistency -->
                <div class="px-6 py-4 border-t border-gray-100">
                    <div class="flex justify-between items-end">
                        <div>
                            <p class="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">${priceLabel}</p>
                            <p class="text-2xl font-bold text-text-main font-mono tracking-tight">${listing.price}</p>
                        </div>
                        <button class="h-10 w-10 rounded-xl ${btnClass} flex items-center justify-center transition-all">
                            <span class="material-icons text-sm">${btnIcon}</span>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    // ── Build one emirate section ─────────────────
    function buildEmirateSection(emirateName, logoHtml, listings, startIndex) {
        const cards = listings.map((l, i) => buildCard(l, startIndex + i)).join('\n');

        return `
        <section>
            <div class="flex items-end justify-between mb-12 border-b border-gray-200 pb-6">
                <div class="flex items-center gap-5">
                    ${logoHtml}
                    <div>
                        <h2 class="text-4xl font-display font-bold text-text-main tracking-tight">${emirateName}</h2>
                    </div>
                </div>
                <a class="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors" href="#">
                    VIEW ALL
                    <span class="material-icons text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${cards}
            </div>
        </section>`;
    }

    // ── Section definitions (no subtitles) ─────────
    const SECTIONS = [
        { name: 'Abu Dhabi', logo: '<img alt="Abu Dhabi Logo" class="h-16 w-auto object-contain flex-shrink-0" src="Abu_Dhabi-logo.png" />' },
        { name: 'Dubai', logo: '<img alt="Dubai Logo" class="h-16 w-auto object-contain flex-shrink-0" src="dubai logo.png" />' },
        { name: 'Sharjah', logo: '<img alt="Sharjah Logo" class="h-16 w-auto object-contain flex-shrink-0" src="SHARJAH-LOGO.png" />' },
        { name: 'Ajman', logo: '<img alt="Ajman Logo" class="h-9 w-auto object-contain flex-shrink-0" src="ajman logo.png" />' },
        { name: 'Umm Al Quwain', logo: '<img alt="Umm Al Quwain Logo" class="h-16 w-auto object-contain flex-shrink-0" src="ummalquein-logo.png" />' },
        { name: 'Ras Al Khaimah', logo: '<img alt="Ras Al Khaimah Logo" class="h-16 w-auto object-contain flex-shrink-0" src="rak-logo.png" />' },
        { name: 'Fujairah', logo: '<img alt="Fujairah Logo" class="h-16 w-auto object-contain flex-shrink-0" src="fujairah-logo.png" />' },
    ];

    // ── Main Init ────────────────────────────────
    async function init() {
        // 1. Wait for generator to be available
        if (!window.UAEPlateGenerator) {
            console.error('UAEPlateGenerator not found. Make sure plate-generator.js is loaded first.');
            return;
        }

        // 2. Find the container for plate sections
        const container = document.getElementById('plate-listings-container');
        if (!container) {
            console.error('#plate-listings-container not found in the DOM.');
            return;
        }

        // 3. Group listings by section (4 per section)
        const grouped = [];
        for (let i = 0; i < LISTINGS.length; i += 4) {
            grouped.push(LISTINGS.slice(i, i + 4));
        }

        // 4. Build all section HTML
        let html = '';
        let globalIdx = 0;
        grouped.forEach((group, sIdx) => {
            const sec = SECTIONS[sIdx];
            if (sec) {
                html += buildEmirateSection(sec.name, sec.logo, group, globalIdx);
            }
            globalIdx += group.length;
        });
        container.innerHTML = html;

        // 5. Load template images
        const images = await loadTemplateImages();

        // 6. Render each plate into its slot
        for (let i = 0; i < LISTINGS.length; i++) {
            const listing = LISTINGS[i];
            const slot = document.getElementById(`plate-slot-${i}`);
            if (!slot) continue;

            const img = images[listing.emirate];
            if (!img) {
                slot.innerHTML = '<p class="text-xs text-red-400">Template missing</p>';
                continue;
            }

            try {
                const canvas = await UAEPlateGenerator.generatePlate({
                    emirate: listing.emirate,
                    plateCode: listing.code,
                    plateNumber: listing.number,
                    blankPlateImage: img
                });

                // Convert canvas to img for lighter DOM (no rounded to avoid cut edges)
                const dataUrl = canvas.toDataURL('image/png');
                slot.innerHTML = `<img src="${dataUrl}" alt="${listing.emirate} ${listing.code} ${listing.number}" 
                    class="w-full h-full object-contain" style="image-rendering: -webkit-optimize-contrast;" />`;
            } catch (e) {
                console.error(`Failed to render plate ${i}:`, e);
                slot.innerHTML = '<p class="text-xs text-red-400">Render failed</p>';
            }
        }
    }

    // Kick off when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to ensure plate-generator.js is initialized
        setTimeout(init, 100);
    }
})();

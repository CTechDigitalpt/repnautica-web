console.log('Interactive Image Map Loaded');
console.log('Image dimensions - Original:', 1695, 'x', 650, '| Display:', 1187, 'x', 455);

let lots = [];
let slotInventory = [];

const isPortuguese = document.documentElement.lang.toLowerCase().startsWith('pt');

async function loadLots() {
    try {
        const dataFile = isPortuguese ? '../assets/data/lots-pt.json' : '../assets/data/lots.json';
        const response = await fetch(dataFile);
        if (!response.ok) {
            throw new Error(`Failed to load lots data: ${response.status}`);
        }
        lots = await response.json();
        updateSummary();
        updateFilterSummary();
        highlightFilteredLots();
    } catch (error) {
        console.error(error);
    }
}

async function loadSlotInventory() {
    try {
        const dataFile = isPortuguese ? '../assets/data/slot-inventory-pt.json' : '../assets/data/slot-inventory.json';
        const response = await fetch(dataFile);
        if (!response.ok) {
            throw new Error(`Failed to load slot inventory data: ${response.status}`);
        }

        slotInventory = await response.json();
        updateSummary();
        updateFilterSummary();
        highlightFilteredLots();
    } catch (error) {
        console.error(error);
    }
}

let activeEquipment = 'boat';
let activeLength = 34;
let selectedLotId = null;
let hoveredLotId = null;

function getLotById(id) {
    return lots.find((lot) => lot.id === id) || null;
}

function getLotStatusClass(status) {
    if (status === 'available') return 'available';
    if (status === 'reserved') return 'reserved';
    if (status === 'offices') return 'offices';
    if (status === 'operations') return 'operations';
    return 'unavailable';
}

function getLotStatusLabel(status) {
    if (status === 'available') return mapCopy.available;
    if (status === 'reserved') return mapCopy.reserved;
    if (status === 'offices') return mapCopy.offices;
    if (status === 'operations') return mapCopy.operations;
    return mapCopy.unavailable;
}

function getLotInventory(lotId) {
    const entry = slotInventory.find((item) => item.lotId === lotId);
    return entry ? entry.slots : [];
}

function getLotAvailability(lotId) {
    const slots = getLotInventory(lotId);
    if (slots.length === 0) {
        return {
            state: 'unknown',
            label: mapCopy.pending,
            className: 'unknown',
            availableCount: 0,
            futureCount: 0,
            totalCount: 0
        };
    }

    const availableCount = slots.filter((slot) => slot.status === 'available').length;
    const futureCount = slots.filter((slot) => slot.status === 'future').length;
    const totalCount = slots.length;

    if (availableCount > 0) {
        const availabilityText = futureCount > 0
            ? `${availableCount} ${isPortuguese ? 'lugar(es)' : `slot${availableCount === 1 ? '' : 's'}`} ${isPortuguese ? 'disponível(eis) agora' : 'available now'} · ${futureCount} ${isPortuguese ? 'previsto(s)' : 'upcoming'}`
            : `${availableCount} ${isPortuguese ? 'lugar(es)' : `slot${availableCount === 1 ? '' : 's'}`} ${mapCopy.availableLabel}`;

        return { state: 'available', label: availabilityText, className: 'available', availableCount, futureCount, totalCount };
    }

    if (futureCount > 0) {
        return {
            state: 'future',
            label: `${futureCount} ${isPortuguese ? 'lugar(es) previsto(s) em breve' : mapCopy.expectedSoon}`,
            className: 'future', availableCount, futureCount, totalCount
        };
    }

    return { state: 'full', label: mapCopy.full, className: 'full', availableCount, futureCount, totalCount };
}

function getUpcomingSlot(lotId) {
    return getLotInventory(lotId).find((slot) => slot.status === 'future') || null;
}

function formatLotSummary(lot) {
    const priceText = lot.price ? `<br>${isPortuguese ? lot.price : `${mapCopy.from} ${lot.price}`}` : '';
    const hoursText = lot.hours ? `<br>${lot.hours}` : '';
    const tonnageText = lot.boatTonnageMax ? `<br>${mapCopy.liftCapacity}: ${isPortuguese ? 'até' : 'up to'} ${lot.boatTonnageMax} ${mapCopy.tonnes}` : '';
    const availability = getLotAvailability(lot.id);
    const upcomingSlot = getUpcomingSlot(lot.id);
    const futureText = upcomingSlot && upcomingSlot.availableFrom
        ? `<br>${mapCopy.expected} ${isPortuguese ? 'disponível' : 'available'}: ${upcomingSlot.availableFrom}`
        : '';

    return `<strong>${lot.label}</strong><br>${lot.category}<br>${lot.description}${hoursText}${tonnageText}<br><br>${mapCopy.boat}: ${lot.boatLengthMin}-${lot.boatLengthMax} ${mapCopy.feet}<br>${mapCopy.trailer}: ${lot.trailerWidth}<br>${mapCopy.space}: ${lot.size}${priceText}<br><br>${availability.label}${futureText}`;
}

function updateSummary() {
    const availableCount = lots.filter((lot) => getLotAvailability(lot.id).state === 'available').length;
    const fullCount = lots.filter((lot) => getLotAvailability(lot.id).state === 'full').length;
    const unknownCount = lots.filter((lot) => getLotAvailability(lot.id).state === 'unknown').length;

    document.getElementById('availableCount').textContent = availableCount;
    document.getElementById('reservedCount').textContent = fullCount;
    document.getElementById('unavailableCount').textContent = unknownCount;
}

function getFilteredLots() {
    return lots.filter((lot) => {
        const equipmentMatch = lot.equipment.includes(activeEquipment);
        const sizeMatch = lot.boatLengthMax >= activeLength;
        return equipmentMatch && sizeMatch;
    });
}

function updateFilterSummary() {
    const filtered = getFilteredLots();
    const summary = document.getElementById('filterSummary');
    if (!summary) return;

    if (filtered.length === 0) {
        summary.textContent = mapCopy.noMatches;
    } else if (isPortuguese) {
        summary.textContent = `${filtered.length} espaço${filtered.length === 1 ? '' : 's'} corresponde${filtered.length === 1 ? '' : 'm'} às suas necessidades.`;
    } else {
        summary.textContent = `${filtered.length} space${filtered.length === 1 ? '' : 's'} match your requirements.`;
    }
}

function highlightFilteredLots() {
    const filteredIds = new Set(getFilteredLots().map((lot) => lot.id));
    document.querySelectorAll('.lot-polygon').forEach((polygon) => {
        const lotId = polygon.dataset.lotId;
        const lot = getLotById(lotId);
        const availability = getLotAvailability(lotId);
        const isVisible = filteredIds.has(lotId);
        const isSelected = selectedLotId === lotId;
        const isHovered = hoveredLotId === lotId;
        if (!isVisible) {
            polygon.setAttribute('fill', '#6c28cb');
            polygon.setAttribute('stroke', '#ad87e3');
            polygon.setAttribute('opacity', '0.45');
        } else {
            polygon.setAttribute('opacity', '1');
            if (isSelected) {
                polygon.setAttribute('fill', '#2563eb');
                polygon.setAttribute('stroke', '#1d4ed8');
            } else if (isHovered) {
                polygon.setAttribute('fill', availability.state === 'full' ? '#f87171' : '#34d399');
                polygon.setAttribute('stroke', '#16324f');
            } else {
                polygon.setAttribute('fill', availability.state === 'full' ? '#ef4444' : '#4ade80');
                polygon.setAttribute('stroke', '#16324f');
            }
        }
    });
}

function openLotModal(lotId) {
    const lot = getLotById(lotId);
    if (!lot) return;
    selectedLotId = lotId;
    highlightFilteredLots();

    const modal = document.getElementById('lotModal');
    const content = document.getElementById('modalContent');
    const availability = getLotAvailability(lot.id);
    const slotMarkup = getLotInventory(lot.id).length
        ? getLotInventory(lot.id).map((slot) => {
            const statusLabel = slot.status === 'available'
                ? mapCopy.available
                : slot.status === 'future'
                    ? mapCopy.upcoming
                    : mapCopy.full;
            const extraInfo = slot.availableFrom ? `<div>${mapCopy.expected}: ${slot.availableFrom}</div>` : '';
            const noteInfo = slot.availabilityNote ? `<div>${slot.availabilityNote}</div>` : '';
            return `<div><strong>${slot.label}</strong> — ${statusLabel} · ${slot.price}${extraInfo}${noteInfo}</div>`;
        }).join('')
        : `<div>${mapCopy.noInventory}</div>`;

    content.innerHTML = `
        <h3>${lot.label}</h3>
        <div class="status-badge ${getLotStatusClass(lot.status)}">${getLotStatusLabel(lot.status)}</div>
        <div class="status-pill ${availability.className}">${availability.label}</div>
        <p><strong>${lot.category}</strong></p>
        <p>${lot.description}</p>
        <p>${lot.suitability}</p>
        <div class="detail-list">
            <div><strong>${mapCopy.spaceSize}:</strong> ${lot.size}</div>
            <div><strong>${mapCopy.boat}:</strong> ${lot.boatLengthMin}–${lot.boatLengthMax} ${mapCopy.feet}</div>
            ${lot.boatTonnageMax ? `<div><strong>${mapCopy.liftCapacity}:</strong> ${isPortuguese ? 'até' : 'up to'} ${lot.boatTonnageMax} ${mapCopy.tonnes}</div>` : ''}
            <div><strong>${mapCopy.trailer}:</strong> ${lot.trailerWidth}</div>
            ${lot.price ? `<div><strong>${mapCopy.price}:</strong> ${lot.price}</div>` : ''}
            ${lot.annual ? `<div><strong>${mapCopy.annual}:</strong> ${lot.annual}</div>` : ''}
            ${lot.hours ? `<div><strong>${mapCopy.access}:</strong> ${lot.hours}</div>` : ''}
        </div>
        <div class="detail-list">
            <div><strong>${mapCopy.slotInventory}</strong></div>
            ${slotMarkup}
        </div>
        <div class="detail-list">
            ${lot.features.map((feature) => `<div>✓ ${feature}</div>`).join('')}
        </div>
        <a class="hero-button" href="${lot.actionUrl || (isPortuguese ? 'main-lots-pt.html' : 'main-lots-en.html') + '?lot=' + lot.id}">${mapCopy.viewAvailability}</a>
    `;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
}

function closeLotModal() {
    const modal = document.getElementById('lotModal');
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
}

function setupPolygonHovers() {
    const tooltip = document.createElement('div');
    tooltip.className = 'area-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    const img = document.getElementById('mapImage');
    const areas = document.querySelectorAll('area');

    function createSVGOverlay() {
        const mapContainer = img.parentElement;
        mapContainer.style.position = 'relative';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '1187');
        svg.setAttribute('height', '455');
        svg.setAttribute('viewBox', '0 0 1187 455');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.pointerEvents = 'auto';

        const lotMap = ['RPN-01', 'RPN-MAIN', 'TRAVEL-LIFT-300', 'TRAVEL-LIFT-50', 'SLIPWAY'];
        areas.forEach((area, index) => {
            const coords = area.getAttribute('coords').split(',').map(Number);
            const lotId = lotMap[index] || `LOT-${index + 1}`;
            const lot = getLotById(lotId);
            const points = coords.reduce((acc, value, coordIndex) => {
                if (coordIndex % 2 === 0) {
                    acc.push(`${value},${coords[coordIndex + 1]}`);
                }
                return acc;
            }, []).join(' ');

            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', points.trim());
            polygon.setAttribute('fill', lot ? (lot.status === 'available' ? '#4ade80' : lot.status === 'reserved' ? '#f59e0b' : lot.status === 'operations' ? '#3b82f6' : lot.status === 'offices' ? '#d946ef' : '#6b7280') : 'transparent');
            polygon.setAttribute('stroke', '#16324f');
            polygon.setAttribute('stroke-width', '2');
            polygon.style.cursor = 'pointer';
            polygon.dataset.lotId = lotId;
            polygon.classList.add('lot-polygon');

            polygon.addEventListener('mouseenter', function(e) {
                hoveredLotId = lotId;
                highlightFilteredLots();
                if (lot) {
                    tooltip.innerHTML = formatLotSummary(lot);
                    tooltip.style.display = 'block';
                    tooltip.style.left = `${e.clientX + 10}px`;
                    tooltip.style.top = `${e.clientY + 10}px`;
                }
            });

            polygon.addEventListener('mousemove', function(e) {
                tooltip.style.left = `${e.clientX + 10}px`;
                tooltip.style.top = `${e.clientY + 10}px`;
            });

            polygon.addEventListener('mouseleave', function() {
                hoveredLotId = null;
                highlightFilteredLots();
                tooltip.style.display = 'none';
            });

            polygon.addEventListener('click', function() {
                openLotModal(lotId);
            });

            svg.appendChild(polygon);
        });

        mapContainer.appendChild(svg);
        updateSummary();
        updateFilterSummary();
        highlightFilteredLots();
    }

    if (img.complete || img.naturalHeight !== 0) {
        createSVGOverlay();
    } else {
        img.addEventListener('load', createSVGOverlay);
    }
}

function bindControls() {
    document.querySelectorAll('#equipmentGroup .chip').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('#equipmentGroup .chip').forEach((chip) => chip.classList.remove('active'));
            button.classList.add('active');
            activeEquipment = button.dataset.type;
            updateFilterSummary();
            highlightFilteredLots();
        });
    });

    const lengthInput = document.getElementById('boatLength');
    lengthInput.addEventListener('input', (event) => {
        activeLength = Number(event.target.value) || 0;
        updateFilterSummary();
        highlightFilteredLots();
    });

    document.getElementById('findSpacesBtn').addEventListener('click', () => {
        updateFilterSummary();
        highlightFilteredLots();
    });

    document.getElementById('closeModalBtn').addEventListener('click', closeLotModal);
    document.getElementById('modalBackdrop').addEventListener('click', closeLotModal);
}

window.addEventListener('load', function() {
    Promise.all([loadLots(), loadSlotInventory()]).then(() => {
        setupPolygonHovers();
        bindControls();
    });
});

const mapCopy = isPortuguese
    ? {
        available: 'Disponível', reserved: 'Reservado', offices: 'Acesso aos escritórios', operations: 'Operações', unavailable: 'Indisponível',
        pending: 'Inventário pendente', full: 'Completo', upcoming: 'Próximo', noInventory: 'Ainda não existe inventário de lugares.',
        from: 'A partir de', boat: 'Barco', trailer: 'Reboque', space: 'Espaço', spaceSize: 'Dimensão do espaço',
        liftCapacity: 'Capacidade de elevação', price: 'Preço', annual: 'Anual', access: 'Acesso', slotInventory: 'Inventário de lugares',
        viewAvailability: 'Ver disponibilidade', expected: 'Previsão', expectedSoon: 'espaço(s) previsto(s) em breve',
        noMatches: 'Nenhum espaço corresponde às suas necessidades.', matches: 'espaço(s) correspondem às suas necessidades.',
        availableNow: 'disponível/agora', availableLabel: 'disponível', feet: 'pés', tonnes: 'toneladas'
    }
    : {
        available: 'Available', reserved: 'Reserved', offices: 'Office access', operations: 'Operations', unavailable: 'Unavailable',
        pending: 'Inventory pending', full: 'Full', upcoming: 'Upcoming', noInventory: 'No slot inventory yet.',
        from: 'From', boat: 'Boat', trailer: 'Trailer', space: 'Space', spaceSize: 'Space size',
        liftCapacity: 'Lift capacity', price: 'Price', annual: 'Annual', access: 'Access', slotInventory: 'Slot inventory',
        viewAvailability: 'View Availability', expected: 'Expected', expectedSoon: 'slot(s) expected soon',
        noMatches: 'No spaces match your current requirements.', matches: 'space(s) match your requirements.',
        availableNow: 'available now', availableLabel: 'available', feet: 'ft', tonnes: 'tonnes'
    };
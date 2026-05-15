let barChart = null;
let baseChart = null;

async function fetchData(filters = {}) {
    console.log('Fetching with filters:', filters);
    const queryParams = new URLSearchParams();
    for (const key in filters) {
        if (filters[key] && filters[key] !== 'all') {
            queryParams.append(key, filters[key]);
        }
    }
    const response = await fetch(`/api/data?${queryParams.toString()}`);
    return await response.json();
}

function populateDropdown(id, list) {
    const select = document.getElementById(id);
    if (select.options.length > 1) return;

    list.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

function updateKPIs(kpis) {
    document.getElementById('kpi-accepted').innerText = kpis.accepted.toLocaleString();
    document.getElementById('kpi-pending').innerText = kpis.pending.toLocaleString();
}

function updateTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.name || 'N/A'}</td>
            <td>${row.material || 'N/A'}</td>
            <td class="text-right">${row.count}</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('row-count').innerText = `${data.length} registros exibidos`;
}

// Premium Color Palettes
const COLORS_VIBRANT = [
    '#18181b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'
];

function updateCharts(data) {
    // 1. Top 5 Pending Chart
    const barCtx = document.getElementById('chart-bar').getContext('2d');
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: data.topPending.map(item => item.name),
            datasets: [{
                label: 'Aceites Pendentes',
                data: data.topPending.map(item => item.count),
                backgroundColor: COLORS_VIBRANT.slice(0, 5),
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { backgroundColor: '#18181b', padding: 12 }
            },
            scales: { 
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            }
        }
    });

    // 2. Base Pending Chart
    const baseCtx = document.getElementById('chart-base-bar').getContext('2d');
    if (baseChart) baseChart.destroy();
    baseChart = new Chart(baseCtx, {
        type: 'bar',
        data: {
            labels: data.baseDistribution.map(item => item.base),
            datasets: [{
                label: 'Pendências por Base',
                data: data.baseDistribution.map(item => item.count),
                backgroundColor: '#18181b',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { backgroundColor: '#18181b', padding: 12 }
            },
            scales: { 
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            }
        }
    });
}

async function loadDashboard() {
    try {
        const filters = {
            name: document.getElementById('filter-name').value,
            material: document.getElementById('filter-material').value,
            base: document.getElementById('filter-base').value
        };
        const data = await fetchData(filters);
        
        populateDropdown('filter-name', data.filters.technicians);
        populateDropdown('filter-base', data.filters.bases);
        populateDropdown('filter-material', data.filters.materials);

         updateKPIs(data.kpis);
         updateTable(data.summaryTable);

         try {
             updateCharts(data);
         } catch (chartError) {
             console.error('Failed to render charts:', chartError);
         }
        console.log('Dashboard updated successfully');
    } catch (err) {
        console.error('Failed to load dashboard:', err);
    }
}

document.getElementById('btn-search').addEventListener('click', (e) => {
    e.preventDefault();
    loadDashboard();
});

// Initial load
loadDashboard();

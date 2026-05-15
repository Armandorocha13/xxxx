/**
 * Lógica de Frontend para o Dashboard de Aceites
 * Integração com a API e renderização de gráficos.
 */

let graficoTecnicos = null;
let graficoBases = null;

/**
 * Busca dados da API com base nos filtros selecionados.
 * @param {Object} filtros - Filtros de nome, material e base.
 */
async function buscarDados(filtros = {}) {
    const parametros = new URLSearchParams();
    for (const chave in filtros) {
        if (filtros[chave] && filtros[chave] !== 'all') {
            parametros.append(chave, filtros[chave]);
        }
    }
    const resposta = await fetch(`/api/dados_dashboard?${parametros.toString()}`);
    return await resposta.json();
}

/**
 * Popula os menus suspensos de filtro.
 */
function popularMenuSuspenso(id, lista) {
    const select = document.getElementById(id);
    if (select.options.length > 1) return; // Evita repopular desnecessariamente

    lista.forEach(item => {
        const opcao = document.createElement('option');
        opcao.value = item;
        opcao.textContent = item;
        select.appendChild(opcao);
    });
}

/**
 * Atualiza os indicadores de KPI na tela.
 */
function atualizarKPIs(kpis) {
    document.getElementById('kpi-aceitos').innerText = kpis.aceitos.toLocaleString();
    document.getElementById('kpi-pendentes').innerText = kpis.pendentes.toLocaleString();
}

/**
 * Atualiza a tabela de resumo com os dados filtrados.
 */
function atualizarTabela(dados) {
    const corpo = document.getElementById('corpo-tabela');
    corpo.innerHTML = '';
    
    dados.forEach(linha => {
        const tr = document.createElement('tr');
        tr.className = 'animate__animated animate__fadeIn';
        tr.innerHTML = `
            <td>${linha.nome || 'N/A'}</td>
            <td>${linha.material || 'N/A'}</td>
            <td class="alinhar-direita">${linha.total}</td>
        `;
        corpo.appendChild(tr);
    });
    
    document.getElementById('contagem-registros').innerText = `${dados.length} categorias identificadas`;
}

// Cores Modernas para os Gráficos
const CORES_PALETA = [
    '#6366f1', '#a855f7', '#ec4899', '#f97316', '#3b82f6',
    '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#64748b'
];

/**
 * Renderiza ou atualiza os gráficos Chart.js.
 */
function atualizarGraficos(dados) {
    // 1. Gráfico de Técnicos (Barras Horizontais)
    const ctxTec = document.getElementById('grafico-barras-tecnicos').getContext('2d');
    if (graficoTecnicos) graficoTecnicos.destroy();
    
    graficoTecnicos = new Chart(ctxTec, {
        type: 'bar',
        data: {
            labels: dados.top_pendentes.map(item => item.nome),
            datasets: [{
                label: 'Pendências',
                data: dados.top_pendentes.map(item => item.total),
                backgroundColor: CORES_PALETA.slice(0, 5),
                borderRadius: 8,
                barThickness: 25
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { 
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' }
                }
            },
            scales: { 
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            }
        }
    });

    // 2. Gráfico de Bases (Barras Verticais)
    const ctxBase = document.getElementById('grafico-barras-bases').getContext('2d');
    if (graficoBases) graficoBases.destroy();
    
    graficoBases = new Chart(ctxBase, {
        type: 'bar',
        data: {
            labels: dados.distribuicao_base.map(item => item.base),
            datasets: [{
                label: 'Total Pendente',
                data: dados.distribuicao_base.map(item => item.total),
                backgroundColor: '#6366f1',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { 
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12
                }
            },
            scales: { 
                x: { grid: { display: false }, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            }
        }
    });
}

/**
 * Carrega todos os dados do dashboard.
 */
async function carregarDashboard() {
    try {
        const filtros = {
            nome: document.getElementById('filtro-nome').value,
            material: document.getElementById('filtro-material').value,
            base: document.getElementById('filtro-base').value
        };
        
        const dados = await buscarDados(filtros);
        
        // Popula menus apenas na primeira carga
        popularMenuSuspenso('filtro-nome', dados.listas_filtros.tecnicos);
        popularMenuSuspenso('filtro-base', dados.listas_filtros.bases);
        popularMenuSuspenso('filtro-materiais', dados.listas_filtros.materiais); // Ajustado para bater com o ID se houver erro

        atualizarKPIs(dados.kpis);
        atualizarGraficos(dados);
        atualizarTabela(dados.tabela_resumo);
        
        console.log('Dashboard LiquidGlass atualizado.');
    } catch (erro) {
        console.error('Falha ao carregar dashboard:', erro);
    }
}

// Event Listeners
document.getElementById('btn-atualizar').addEventListener('click', (e) => {
    e.preventDefault();
    carregarDashboard();
});

// Seletores de Projeto (Simulação)
document.getElementById('btn-emis').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('btn-eter').classList.remove('active');
});

document.getElementById('btn-eter').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('btn-emis').classList.remove('active');
});

// Carga Inicial
carregarDashboard();

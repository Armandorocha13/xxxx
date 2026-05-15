/**
 * Aplicação Principal do Frontend
 * ==================================
 * Orquestra: filtros, KPIs, gráficos e tabela.
 * Este arquivo APENAS coordena os módulos, sem lógica pesada.
 *
 * Módulos utilizados:
 * - servicos_api.js       → Comunicação HTTP
 * - renderizador_graficos.js → Chart.js
 */

import { buscarDados } from './servicos_api.js';
import { renderizarGraficoTecnicos, renderizarGraficoBases } from './renderizador_graficos.js';

// ── Referências aos elementos do DOM ──────────────────
const elFiltroNome     = document.getElementById('filtro-nome');
const elFiltroBase     = document.getElementById('filtro-base');
const elFiltroMaterial = document.getElementById('filtro-material');
const elBtnAtualizar   = document.getElementById('btn-atualizar');
const elKpiAceitos     = document.getElementById('kpi-aceitos');
const elKpiPendentes   = document.getElementById('kpi-pendentes');
const elCorpoTabela    = document.getElementById('corpo-tabela');
const elContagem       = document.getElementById('contagem-registros');

// ── Funções de UI ──────────────────────────────────────

/**
 * Popula um <select> com opções únicas do banco.
 * Só executa na primeira carga para não resetar a seleção do usuário.
 * @param {HTMLSelectElement} elemento
 * @param {string[]} lista
 */
function popularMenuSuspenso(elemento, lista) {
    if (elemento.options.length > 1) return;
    lista.forEach(item => {
        const opcao = document.createElement('option');
        opcao.value = item;
        opcao.textContent = item;
        elemento.appendChild(opcao);
    });
}

/**
 * Atualiza os cards de KPI na tela.
 * @param {{ aceitos: number, pendentes: number }} kpis
 */
function atualizarKPIs({ aceitos, pendentes }) {
    elKpiAceitos.textContent   = aceitos.toLocaleString('pt-BR');
    elKpiPendentes.textContent = pendentes.toLocaleString('pt-BR');
}

/**
 * Renderiza as linhas da tabela de pendências.
 * @param {Array<{ nome, material, total }>} linhas
 */
function atualizarTabela(linhas) {
    elCorpoTabela.innerHTML = '';
    linhas.forEach(({ nome, material, total }) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nome   ?? 'N/A'}</td>
            <td>${material ?? 'N/A'}</td>
            <td class="alinhar-direita">${total}</td>
        `;
        elCorpoTabela.appendChild(tr);
    });
    elContagem.textContent = `${linhas.length} itens encontrados`;
}

// ── Carregamento do Dashboard ──────────────────────────

/**
 * Função principal: busca dados e atualiza toda a UI.
 */
async function carregarDashboard() {
    try {
        const filtros = {
            nome:     elFiltroNome.value,
            material: elFiltroMaterial.value,
            base:     elFiltroBase.value,
        };

        const dados = await buscarDados(filtros);

        // Popula os menus suspensos (apenas na 1ª carga)
        popularMenuSuspenso(elFiltroNome,     dados.listas_filtros.tecnicos);
        popularMenuSuspenso(elFiltroBase,     dados.listas_filtros.bases);
        popularMenuSuspenso(elFiltroMaterial, dados.listas_filtros.materiais);

        // Atualiza os componentes visuais
        atualizarKPIs(dados.kpis);
        renderizarGraficoTecnicos(dados.top_pendentes);
        renderizarGraficoBases(dados.distribuicao_base);
        atualizarTabela(dados.tabela_resumo);

        // Reinicializa os ícones Lucide após inserção dinâmica
        lucide.createIcons();

    } catch (erro) {
        console.error('[ERRO] Falha ao carregar o dashboard:', erro.message);
        elContagem.textContent = 'Erro ao carregar dados.';
    }
}

// ── Event Listeners ────────────────────────────────────

// Botão de filtro
elBtnAtualizar.addEventListener('click', e => {
    e.preventDefault();
    carregarDashboard();
});

// Alternância de projeto (EMIS / ETER)
document.getElementById('btn-emis').addEventListener('click', function () {
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('btn-eter').classList.remove('active');
    document.getElementById('btn-eter').setAttribute('aria-pressed', 'false');
});

document.getElementById('btn-eter').addEventListener('click', function () {
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('btn-emis').classList.remove('active');
    document.getElementById('btn-emis').setAttribute('aria-pressed', 'false');
});

// ── Inicialização ──────────────────────────────────────
carregarDashboard();

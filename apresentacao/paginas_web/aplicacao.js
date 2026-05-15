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
const elFiltroStatus   = document.getElementById('filtro-status');
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
/**
 * Popula um <select> com opções únicas do banco.
 * @param {HTMLSelectElement} elemento
 * @param {string[]} lista
 * @param {boolean} preservarSelecao - Se true, tenta manter o valor selecionado
 */
function popularMenuSuspenso(elemento, lista, preservarSelecao = false) {
    const valorAtual = elemento.value;
    
    // Define o texto do placeholder padrão
    let placeholder = 'Todos os técnicos';
    if (elemento.id === 'filtro-base')     placeholder = 'Todas as bases';
    if (elemento.id === 'filtro-material') placeholder = 'Todos os materiais';

    elemento.innerHTML = `<option value="all">${placeholder}</option>`;

    lista.forEach(item => {
        const opcao = document.createElement('option');
        opcao.value = item;
        opcao.textContent = item;
        elemento.appendChild(opcao);
    });

    if (preservarSelecao) {
        elemento.value = valorAtual;
    }
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
    linhas.forEach(({ nome, base, material, status_item, dias, total }) => {
        const tr = document.createElement('tr');
        
        // Define classe de urgência para dias
        const classeDias = dias > 15 ? 'urgente' : (dias > 7 ? 'alerta' : '');
        const textoDias = dias === 1 ? '1 dia' : `${dias} dias`;

        // Define classe para o status
        const isAceito = status_item === 'Aceito';
        const classeStatus = isAceito ? 'aceito' : 'pendente';
        const textoStatus  = isAceito ? 'Aceito' : 'Pendente';
        
        tr.innerHTML = `
            <td>${nome   ?? 'N/A'}</td>
            <td><span class="badge-base">${base ?? 'N/A'}</span></td>
            <td>${material ?? 'N/A'}</td>
            <td><span class="badge-status ${classeStatus}">${textoStatus}</span></td>
            <td class="alinhar-centro"><span class="badge-dias ${classeDias}">${textoDias}</span></td>
            <td class="alinhar-direita"><strong>${total}</strong></td>
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
            status:   elFiltroStatus.value,
        };

        const dados = await buscarDados(filtros);

        // Popula os menus suspensos
        // A base nunca muda para permitir trocar entre bases facilmente
        if (elFiltroBase.options.length <= 1) {
            popularMenuSuspenso(elFiltroBase, dados.listas_filtros.bases);
        }

        // Técnicos e Materiais são atualizados dinamicamente
        popularMenuSuspenso(elFiltroNome,     dados.listas_filtros.tecnicos, true);
        popularMenuSuspenso(elFiltroMaterial, dados.listas_filtros.materiais, true);

        // Atualiza primeiro os dados principais da tela
        atualizarKPIs(dados.kpis);
        atualizarTabela(dados.tabela_resumo);

        // Os gráficos dependem de Chart.js; se a lib falhar, o restante continua visível.
        try {
            renderizarGraficoTecnicos(dados.top_pendentes);
            renderizarGraficoBases(dados.distribuicao_base);
        } catch (erroGraficos) {
            console.error('[ERRO] Falha ao renderizar gráficos:', erroGraficos.message);
        }

        // Reinicializa os ícones Lucide após inserção dinâmica
        lucide.createIcons();

    } catch (erro) {
        console.error('[ERRO] Falha ao carregar o dashboard:', erro.message);
        elContagem.textContent = 'Erro de conexão: use a porta 3000';
        elKpiAceitos.textContent = 'ERR';
        elKpiPendentes.textContent = 'ERR';
    }
}

// ── Event Listeners ────────────────────────────────────

// Botão de filtro (manual)
elBtnAtualizar.addEventListener('click', e => {
    e.preventDefault();
    carregarDashboard();
});

// Filtros Dinâmicos (atualizam ao mudar)
[elFiltroNome, elFiltroBase, elFiltroMaterial, elFiltroStatus].forEach(el => {
    if (el) el.addEventListener('change', () => carregarDashboard());
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

/**
 * Aplicação Principal do Frontend
 * ==================================
 * Orquestra: filtros, KPIs, gráficos, tabela e resumo unificado.
 */

import { buscarDados, buscarResumoUnificado } from './servicos_api.js';
import { 
    renderizarGraficoTecnicos, 
    renderizarGraficoBases,
    renderizarGraficosResumo
} from './renderizador_graficos.js';

// ── Referências aos elementos do DOM ──────────────────
const elFiltroStatus     = document.getElementById('filtro-status');
const elFiltroNome       = document.getElementById('filtro-nome');
const elFiltroBase       = document.getElementById('filtro-base');
const elFiltroMaterial   = document.getElementById('filtro-material');
const elCorpoTabela      = document.getElementById('corpo-tabela');
const elCorpoTabelaResumo = document.getElementById('corpo-tabela-resumo');
const elContagem         = document.getElementById('contagem-registros');
const elTextoAtualizacao = document.getElementById('texto-atualizacao');

// ── Estado da Aplicação ──────────────────────────────
let projetoAtivo = 'EMIS';
let dadosResumoUnificado = []; // Cache local para permitir filtros ultra rápidos

// ── Funções de UI ──────────────────────────────────────

/**
 * Reseta os menus suspensos para carregar novos dados.
 */
function resetarFiltros() {
    [elFiltroNome, elFiltroBase, elFiltroMaterial].forEach(el => {
        if (el) el.innerHTML = `<option value="all">Carregando...</option>`;
    });
}

/**
 * Popula um <select> com opções únicas.
 */
function popularMenuSuspenso(elemento, lista, preservarSelecao = false) {
    if (!elemento) return;
    const valorAtual = elemento.value;
    
    let placeholder = 'Todos os técnicos';
    if (elemento.id === 'filtro-base')     placeholder = 'Todas as bases';
    if (elemento.id === 'filtro-material') placeholder = 'Todos os materiais';

    elemento.innerHTML = `<option value="all">${placeholder}</option>`;

    lista.forEach(item => {
        if (!item) return;
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
 */
function atualizarKPIs({ aceitos, pendentes }) {
    const elKpiAceitos = document.getElementById('kpi-aceitos');
    const elKpiPendentes = document.getElementById('kpi-pendentes');
    if (elKpiAceitos) elKpiAceitos.textContent = aceitos.toLocaleString('pt-BR');
    if (elKpiPendentes) elKpiPendentes.textContent = pendentes.toLocaleString('pt-BR');
}

/**
 * Renderiza as linhas da tabela de pendências dos projetos individuais.
 */
function atualizarTabela(linhas) {
    if (!elCorpoTabela) return;
    elCorpoTabela.innerHTML = '';
    linhas.forEach(({ nome, base, material, status_item, dias, total }) => {
        const tr = document.createElement('tr');
        
        const classeDias = dias > 15 ? 'urgente' : (dias > 7 ? 'alerta' : '');
        const textoDias = dias === 1 ? '1 dia' : `${dias} dias`;

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
    if (elContagem) elContagem.textContent = `${linhas.length} itens encontrados`;
}

/**
 * Alterna a visibilidade das seções baseada no projeto ativo.
 */
function alternarVisualizacaoSecoes(ativo) {
    const isResumo = ativo === 'RESUMO';
    
    // Filtros e Indicadores
    const elFiltrosBar = document.querySelector('.filtros-bar');
    const elKpisRow    = document.querySelector('.kpis-row');
    const elTabelaCard = document.querySelector('.tabela-card');
    const elGraficosRow = document.querySelector('.graficos-row');
    const elSecaoResumo = document.getElementById('secao-resumo');

    // Filtros específicos da aba resumo
    const containerStatus = document.getElementById('container-filtro-status');
    const containerMaterial = document.getElementById('container-filtro-material');

    if (isResumo) {
        if (elFiltrosBar) elFiltrosBar.style.display = 'flex';
        if (containerStatus) containerStatus.style.display = 'none';
        if (containerMaterial) containerMaterial.style.display = 'none';
        if (elKpisRow)    elKpisRow.style.display = 'none';
        if (elTabelaCard) elTabelaCard.style.display = 'none';
        if (elGraficosRow) elGraficosRow.style.display = 'none';
        if (elSecaoResumo) elSecaoResumo.style.display = 'block';
    } else {
        const isEter = ativo === 'ETER';
        if (elFiltrosBar) elFiltrosBar.style.display = 'flex';
        if (containerStatus) containerStatus.style.display = isEter ? 'none' : 'block';
        if (containerMaterial) containerMaterial.style.display = 'block';
        if (elKpisRow)    elKpisRow.style.display = 'grid';
        if (elTabelaCard) elTabelaCard.style.display = 'block';
        if (elGraficosRow) elGraficosRow.style.display = 'grid';
        if (elSecaoResumo) elSecaoResumo.style.display = 'none';
    }
}

/**
 * Renderiza a Tabela de Resumo Consolidado com a funcionalidade de Drilldown/Accordion do Excel.
 */
function renderizarTabelaResumoConsolidado(dados) {
    if (!elCorpoTabelaResumo) return;
    elCorpoTabelaResumo.innerHTML = '';

    if (!dados || dados.length === 0) {
        elCorpoTabelaResumo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--cinza-500); padding: 2rem;">
                    Nenhuma pendência localizada com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    dados.forEach(tecnico => {
        const tr = document.createElement('tr');
        tr.className = 'tr-resumo-tecnico';
        tr.setAttribute('data-tecnico', tecnico.nome);

        // Classe de urgência
        const classeDias = tecnico.dias_max > 15 ? 'urgente' : (tecnico.dias_max > 7 ? 'alerta' : '');
        const textoDias = tecnico.dias_max === 0 ? '0 dias' : (tecnico.dias_max === 1 ? '1 dia' : `${tecnico.dias_max} dias`);

        tr.innerHTML = `
            <td class="alinhar-centro">
                <span style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700; color: var(--preto);">
                    <i data-lucide="chevron-right" class="chevron-icone" style="width: 14px; height: 14px; transition: transform 0.2s;"></i>
                    ${tecnico.nome}
                </span>
            </td>
            <td class="alinhar-centro"><span class="badge-base" style="background: rgba(200, 33, 42, 0.08); color: #c8212a;">${tecnico.emis_qtd}</span></td>
            <td class="alinhar-centro"><span class="badge-base" style="background: rgba(30, 43, 122, 0.08); color: #1e2b7a;">${tecnico.eter_qtd}</span></td>
            <td class="alinhar-centro"><span class="badge-resumo-dias ${classeDias}">${textoDias}</span></td>
            <td class="alinhar-centro"><strong>${tecnico.total_qtd}</strong></td>
        `;

        // Lógica de Drilldown (Dynamic Excel explosion) ao clicar na linha
        tr.addEventListener('click', function () {
            const expandido = tr.classList.toggle('expandido');
            const chevron = tr.querySelector('.chevron-icone');
            
            if (chevron) {
                chevron.style.transform = expandido ? 'rotate(90deg)' : 'rotate(0deg)';
            }

            if (expandido) {
                // Cria a linha de detalhe
                const trDetalhe = document.createElement('tr');
                trDetalhe.className = 'row-detalhe';
                
                // Formata os materiais como tags elegantes
                const emisTags = tecnico.emis_materiais 
                    ? tecnico.emis_materiais.split(', ').map(m => `<span class="detalhe-item-tag" title="${m}">${m}</span>`).join('')
                    : '<em style="color: var(--cinza-400);">Nenhum item pendente no EMIS</em>';

                const eterTags = tecnico.eter_materiais 
                    ? tecnico.eter_materiais.split(', ').map(m => `<span class="detalhe-item-tag" title="${m}">${m}</span>`).join('')
                    : '<em style="color: var(--cinza-400);">Nenhum item pendente no ETER</em>';

                trDetalhe.innerHTML = `
                    <td colspan="5" style="padding: 0;">
                        <div class="detalhe-conteudo">
                            <div class="detalhe-grid">
                                <div class="detalhe-secao">
                                    <h4 class="EMIS"><i data-lucide="package"></i> Detalhes EMIS (${tecnico.emis_qtd} itens, aging: ${tecnico.emis_dias}d)</h4>
                                    <div style="margin-top: 0.5rem;">${emisTags}</div>
                                </div>
                                <div class="detalhe-secao">
                                    <h4 class="ETER"><i data-lucide="cpu"></i> Detalhes ETER (${tecnico.eter_qtd} itens, aging: ${tecnico.eter_dias}d)</h4>
                                    <div style="margin-top: 0.5rem;">${eterTags}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                tr.parentNode.insertBefore(trDetalhe, tr.nextSibling);
                lucide.createIcons();
            } else {
                // Remove a linha de detalhe
                const proximo = tr.nextSibling;
                if (proximo && proximo.classList.contains('row-detalhe')) {
                    proximo.remove();
                }
            }
        });

        elCorpoTabelaResumo.appendChild(tr);
    });

    lucide.createIcons();
}

/**
 * Filtra e renderiza localmente a tabela de Resumo Consolidado e seus gráficos.
 */
function aplicarFiltrosResumo() {
    const nomeFiltro = elFiltroNome?.value || 'all';
    const baseFiltro = elFiltroBase?.value || 'all';

    let dadosFiltrados = [...dadosResumoUnificado];

    if (nomeFiltro !== 'all') {
        dadosFiltrados = dadosFiltrados.filter(t => t.nome === nomeFiltro);
    }

    if (baseFiltro !== 'all') {
        dadosFiltrados = dadosFiltrados.filter(t => 
            t.bases && t.bases.toLowerCase().split(', ').some(b => b.trim() === baseFiltro.toLowerCase())
        );
    }

    renderizarTabelaResumoConsolidado(dadosFiltrados);
    
    // Atualiza os gráficos do resumo com os dados filtrados
    try {
        renderizarGraficosResumo(dadosFiltrados);
    } catch (erroGraficos) {
        console.error('[ERRO] Falha ao atualizar gráficos do resumo:', erroGraficos.message);
    }
}

/**
 * Busca os dados da visão de Resumo Unificado a partir da API.
 */
async function carregarResumoUnificado() {
    try {
        if (!elCorpoTabelaResumo) return;
        elCorpoTabelaResumo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <i data-lucide="loader-2" class="sync-icon animacao-carregando" style="margin-bottom: 0.8rem; width: 32px; height: 32px; animation: spin 1s linear infinite;"></i>
                    <p style="font-weight: 600; color: var(--cinza-500);">Consolidando dados unificados de EMIS e ETER...</p>
                </td>
            </tr>
        `;
        lucide.createIcons();

        const dados = await buscarResumoUnificado();
        dadosResumoUnificado = dados; // Salva no cache

        // Popula filtros globais baseados nos dados unificados
        const nomesTecnicos = [...new Set(dados.map(d => d.nome))].sort();
        popularMenuSuspenso(elFiltroNome, nomesTecnicos, true);

        // Popula as bases ativas nas pendências consolidadas
        const todasBases = [];
        dados.forEach(d => {
            if (d.bases) {
                d.bases.split(', ').forEach(b => {
                    const baseLimpa = b.trim();
                    if (baseLimpa) todasBases.push(baseLimpa);
                });
            }
        });
        const basesUnicas = [...new Set(todasBases)].sort();
        popularMenuSuspenso(elFiltroBase, basesUnicas, true);

        // Reseta o filtro de material para "Todos os materiais" na aba Resumo para não ficar travado em "Carregando..."
        if (elFiltroMaterial) {
            elFiltroMaterial.innerHTML = `<option value="all">Todos os materiais</option>`;
        }

        // Aplica os filtros e renderiza
        aplicarFiltrosResumo();

    } catch (erro) {
        console.error('[ERRO] Falha ao carregar resumo unificado:', erro);
        if (elCorpoTabelaResumo) {
            elCorpoTabelaResumo.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #c8212a; font-weight: 700; padding: 2rem;">
                        Erro ao carregar o resumo consolidado de pendências.
                    </td>
                </tr>
            `;
        }
    }
}

// ── Carregamento do Dashboard ──────────────────────────

/**
 * Função principal: busca dados e atualiza toda a UI.
 */
async function carregarDashboard() {
    if (projetoAtivo === 'RESUMO') {
        alternarVisualizacaoSecoes('RESUMO');
        await carregarResumoUnificado();
        return;
    }

    alternarVisualizacaoSecoes(projetoAtivo);

    try {
        const isEter = projetoAtivo === 'ETER';
        const elCardAceitos = document.getElementById('card-kpi-aceitos');
        const elFiltroStatusCont = document.getElementById('container-filtro-status');
        
        if (elCardAceitos) elCardAceitos.style.display = isEter ? 'none' : 'flex';
        if (elFiltroStatusCont) elFiltroStatusCont.style.display = isEter ? 'none' : 'block';

        const filtros = {
            projeto:  projetoAtivo,
            nome:     elFiltroNome ? elFiltroNome.value : 'all',
            material: elFiltroMaterial ? elFiltroMaterial.value : 'all',
            base:     elFiltroBase ? elFiltroBase.value : 'all',
            status:   isEter ? 'Pendente' : (elFiltroStatus?.value || 'all'),
        };

        const dados = await buscarDados(filtros);

        popularMenuSuspenso(elFiltroBase,     dados.listas_filtros.bases, true);
        popularMenuSuspenso(elFiltroNome,     dados.listas_filtros.tecnicos, true);
        popularMenuSuspenso(elFiltroMaterial, dados.listas_filtros.materiais, true);

        atualizarKPIs(dados.kpis);
        atualizarTabela(dados.tabela_resumo);

        if (elTextoAtualizacao && dados.ultima_atualizacao) {
            elTextoAtualizacao.textContent = dados.ultima_atualizacao.split(', ')[0] || dados.ultima_atualizacao;
        }

        try {
            renderizarGraficoTecnicos(dados.top_pendentes);
            renderizarGraficoBases(dados.distribuicao_base);
        } catch (erroGraficos) {
            console.error('[ERRO] Falha ao renderizar gráficos principais:', erroGraficos.message);
        }

        lucide.createIcons();

    } catch (erro) {
        console.error('[ERRO] Falha ao carregar o dashboard:', erro.message);
        if (elContagem) elContagem.textContent = 'Erro de conexão: use a porta 3000';
    }
}

// ── Event Listeners ────────────────────────────────────

// Filtros Dinâmicos
[elFiltroNome, elFiltroBase, elFiltroMaterial, elFiltroStatus].forEach(el => {
    if (el) el.addEventListener('change', () => {
        if (projetoAtivo === 'RESUMO') {
            aplicarFiltrosResumo();
        } else {
            carregarDashboard();
        }
    });
});

// Setup de botões de navegação e toggles de projeto
function configurarNavegacaoBotao(btnId, projetoVal) {
    const el = document.getElementById(btnId);
    if (!el) return;
    el.addEventListener('click', function() {
        if (projetoAtivo === projetoVal) return;
        projetoAtivo = projetoVal;
        
        // Remove active de todos
        ['btn-emis', 'btn-eter', 'btn-resumo', 'btn-emis-mobile', 'btn-eter-mobile', 'btn-resumo-mobile'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });

        // Adiciona active no botão clicado e no seu correspondente mobile/desktop
        const classes = [btnId];
        if (btnId.endsWith('-mobile')) {
            classes.push(btnId.replace('-mobile', ''));
        } else {
            classes.push(btnId + '-mobile');
        }

        classes.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            }
        });

        // Fecha menu mobile se aberto
        const mobileMenu = document.getElementById('mobile-menu');
        const btnHamburger = document.getElementById('btn-menu-mobile');
        const header = document.getElementById('app-header');
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            mobileMenu.classList.remove('open');
            if (btnHamburger) btnHamburger.classList.remove('open');
            if (header) header.classList.remove('menu-open');
            document.body.style.overflow = '';
        }

        resetarFiltros();
        carregarDashboard();
    });
}

configurarNavegacaoBotao('btn-emis', 'EMIS');
configurarNavegacaoBotao('btn-eter', 'ETER');
configurarNavegacaoBotao('btn-resumo', 'RESUMO');

configurarNavegacaoBotao('btn-emis-mobile', 'EMIS');
configurarNavegacaoBotao('btn-eter-mobile', 'ETER');
configurarNavegacaoBotao('btn-resumo-mobile', 'RESUMO');

// ── Inicialização ──────────────────────────────────────
carregarDashboard();

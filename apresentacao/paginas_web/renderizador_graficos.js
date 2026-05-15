/**
 * Módulo: Renderizador de Gráficos
 * ==================================
 * Usa Chart.js para renderizar:
 *   - Barras horizontais (Top 5 técnicos) → cor VERMELHA
 *   - Colunas verticais (Por base)         → cor AZUL ESCURO
 */

let graficoTecnicos = null;
let graficoBases    = null;

// ── Cores FFA da logo ─────────────────────────────
const VERMELHO_FFA    = '#c8212a';  /* Gráfico Top 5: barras horizontais */
const AZUL_FFA        = '#1e2b7a';  /* Gráfico Bases: colunas verticais  */

// ── Configuração de Tooltip padrão ────────────────────
const TOOLTIP = {
  backgroundColor : 'rgba(15,20,40,0.88)',
  padding         : 12,
  cornerRadius    : 10,
  titleFont       : { family:'Plus Jakarta Sans', size:13, weight:'bold' },
  bodyFont        : { family:'Plus Jakarta Sans', size:12 },
};

// ── Escalas sem grades para visual limpo ─────────────
const ESCALA_LIMPA = {
  x: { grid:{ display:false }, border:{ display:false }, ticks:{ font:{ family:'Plus Jakarta Sans', size:11 } } },
  y: { grid:{ display:false }, border:{ display:false }, ticks:{ font:{ family:'Plus Jakarta Sans', size:11 } } },
};

/**
 * Renderiza o gráfico horizontal de barras (Top 5 técnicos pendentes).
 * Cor: VERMELHO único em todas as barras.
 * @param {Array<{ nome: string, total: number }>} dados
 */
export function renderizarGraficoTecnicos(dados) {
  const ctx = document.getElementById('grafico-tecnicos').getContext('2d');
  if (graficoTecnicos) graficoTecnicos.destroy();

  graficoTecnicos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels  : dados.map(d => d.nome),
      datasets: [{
        label          : 'Pendências',
        data           : dados.map(d => d.total),
        backgroundColor: VERMELHO_FFA,
        borderRadius   : 8,
        barThickness   : 20,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend:{ display:false }, tooltip: TOOLTIP },
      scales : ESCALA_LIMPA,
    },
  });
}

/**
 * Renderiza o gráfico de colunas verticais (pendências por base).
 * Cor: AZUL ESCURO único em todas as colunas.
 * @param {Array<{ base: string, total: number }>} dados
 */
export function renderizarGraficoBases(dados) {
  const ctx = document.getElementById('grafico-bases').getContext('2d');
  if (graficoBases) graficoBases.destroy();

  graficoBases = new Chart(ctx, {
    type: 'bar',
    data: {
      labels  : dados.map(d => d.base),
      datasets: [{
        label          : 'Total Pendente',
        data           : dados.map(d => d.total),
        backgroundColor: AZUL_FFA,
        borderRadius   : 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend:{ display:false }, tooltip: TOOLTIP },
      scales : ESCALA_LIMPA,
    },
  });
}

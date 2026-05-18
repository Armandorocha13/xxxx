/**
 * Módulo: Renderizador de Gráficos
 * ==================================
 * Chart.js: barras horizontais (Top 5 técnicos) e colunas (Bases).
 */

let graficoTecnicos = null;
let graficoBases    = null;

const VERMELHO_FFA = '#c8212a';
const AZUL_FFA     = '#1e2b7a';

const TOOLTIP = {
  backgroundColor : 'rgba(15,20,40,0.88)',
  padding         : 10,
  cornerRadius    : 8,
  titleFont       : { family:'Plus Jakarta Sans', size:12, weight:'bold' },
  bodyFont        : { family:'Plus Jakarta Sans', size:11 },
};

/** Top 5 técnicos — barras horizontais */
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
        borderRadius   : 6,
        barThickness   : 16,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 8 } },
      plugins: { legend:{ display:false }, tooltip: TOOLTIP },
      scales: {
        x: { grid:{ display:false }, border:{ display:false }, ticks:{ font:{ family:'Plus Jakarta Sans', size:10 } } },
        y: { grid:{ display:false }, border:{ display:false }, ticks:{ font:{ family:'Plus Jakarta Sans', size:10 }, maxTicksLimit: 5 } },
      },
    },
  });
}

/** Pendências por base — colunas verticais */
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
        borderRadius   : 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8 } },
      plugins: { legend:{ display:false }, tooltip: TOOLTIP },
      scales: {
        x: {
          grid:{ display:false }, border:{ display:false },
          ticks:{ font:{ family:'Plus Jakarta Sans', size:9 }, maxRotation: 40, minRotation: 30 }
        },
        y: {
          grid:{ color:'rgba(0,0,0,0.05)' }, border:{ display:false },
          ticks:{ font:{ family:'Plus Jakarta Sans', size:10 } }
        },
      },
    },
  });
}

let graficoResumoTecnicos = null;
let graficoResumoProjetos = null;

/**
 * Renderiza gráficos para a aba Resumo Consolidado (Técnicos e Projetos)
 */
export function renderizarGraficosResumo(dados) {
  // 1. Gráfico de TOP 5 Acumulados
  const ctxTecnicos = document.getElementById('grafico-resumo-tecnicos')?.getContext('2d');
  if (ctxTecnicos) {
    if (graficoResumoTecnicos) graficoResumoTecnicos.destroy();

    const top5 = [...dados].sort((a, b) => b.total_qtd - a.total_qtd).slice(0, 5);

    graficoResumoTecnicos = new Chart(ctxTecnicos, {
      type: 'bar',
      data: {
        labels: top5.map(d => d.nome),
        datasets: [{
          label: 'Total Pendências',
          data: top5.map(d => d.total_qtd),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barThickness: 16,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 8 } },
        plugins: { legend: { display: false }, tooltip: TOOLTIP },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } },
          y: { grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } },
        },
      },
    });
  }

  // 2. Gráfico de Rosca (Proporção EMIS vs ETER)
  const ctxProjetos = document.getElementById('grafico-resumo-projetos')?.getContext('2d');
  if (ctxProjetos) {
    if (graficoResumoProjetos) graficoResumoProjetos.destroy();

    const totalEmis = dados.reduce((acc, curr) => acc + curr.emis_qtd, 0);
    const totalEter = dados.reduce((acc, curr) => acc + curr.eter_qtd, 0);

    graficoResumoProjetos = new Chart(ctxProjetos, {
      type: 'doughnut',
      data: {
        labels: ['EMIS', 'ETER'],
        datasets: [{
          data: [totalEmis, totalEter],
          backgroundColor: [VERMELHO_FFA, AZUL_FFA],
          borderWidth: 2,
          hoverOffset: 4
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' }, padding: 15 }
          },
          tooltip: TOOLTIP
        },
        cutout: '65%'
      },
    });
  }
}


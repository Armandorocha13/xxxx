/**
 * Módulo de Comunicação com a API
 * =================================
 * Responsável exclusivamente por fazer as requisições HTTP ao servidor.
 * Isola a lógica de rede do restante do frontend.
 */

/**
 * Busca os dados do dashboard aplicando os filtros selecionados.
 * @param {{ nome: string, material: string, base: string }} filtros
 * @returns {Promise<Object>}
 */
export async function buscarDados(filtros = {}) {
    const parametros = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) {
        if (valor && valor !== 'all') {
            parametros.append(chave, valor);
        }
    }
    const resposta = await fetch(`/api/dados_dashboard?${parametros.toString()}`);
    if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);
    return resposta.json();
}

/**
 * Busca o resumo unificado de pendências (EMIS e ETER por técnico).
 * @returns {Promise<Array>}
 */
export async function buscarResumoUnificado() {
    const resposta = await fetch('/api/resumo_unificado');
    if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);
    return resposta.json();
}

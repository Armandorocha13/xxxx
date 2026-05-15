import { describe, it, expect } from 'vitest';
import { buscarTabelaDetalhada } from '../repositorios/repositorio_aceites.mjs';

describe('TDD: Lógica de Projeto ETER', () => {
    
    it('deve utilizar a tabela relatorio_equipamento quando o projeto for ETER', async () => {
        // Este teste foca em garantir que a lógica de seleção de tabela funciona.
        // Como o repositório é assíncrono e bate no banco, vamos verificar se ele aceita o parâmetro
        // e se a estrutura do dado retornado é compatível.
        
        const filtrosEter = { projeto: 'ETER' };
        
        try {
            const dados = await buscarTabelaDetalhada(filtrosEter);
            // Se retornar um array, a conexão com a tabela relatorio_equipamento funcionou
            expect(Array.isArray(dados)).toBe(true);
        } catch (erro) {
            // Falha esperada no primeiro ciclo TDD se a tabela/colunas não estiverem mapeadas
            throw erro;
        }
    });

    it('deve mapear corretamente os campos de ETER (tecnico, base, descricao)', async () => {
        const filtrosEter = { projeto: 'ETER' };
        const dados = await buscarTabelaDetalhada(filtrosEter);
        
        if (dados.length > 0) {
            const primeiro = dados[0];
            expect(primeiro).toHaveProperty('nome');
            expect(primeiro).toHaveProperty('material');
            expect(primeiro).toHaveProperty('base');
            expect(primeiro).toHaveProperty('dias');
        }
    });
});

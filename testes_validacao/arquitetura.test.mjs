/**
 * Suíte de Testes — Arquitetura do Projeto
 * ==========================================
 * Verifica se a estrutura de pastas segue o padrão
 * de Arquitetura Limpa em PT-BR snake_case.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const raiz = process.cwd();

function existePasta(nome) {
    return fs.existsSync(path.join(raiz, nome));
}

function existeArquivo(caminho) {
    return fs.existsSync(path.join(raiz, caminho));
}

describe('Arquitetura Limpa PT-BR Snake Case', () => {
    it('deve ter a pasta de configurações', () => {
        expect(existePasta('configuracoes')).toBe(true);
    });

    it('deve ter a pasta de repositórios (acesso a dados)', () => {
        expect(existePasta('repositorios')).toBe(true);
    });

    it('deve ter a pasta de casos de uso (lógica de negócio)', () => {
        expect(existePasta('casos_de_uso')).toBe(true);
    });

    it('deve ter a pasta de controladores (API)', () => {
        expect(existePasta('controladores')).toBe(true);
    });

    it('deve ter a pasta de apresentação (frontend)', () => {
        expect(existePasta('apresentacao')).toBe(true);
    });

    it('deve ter o arquivo de configuração global', () => {
        expect(existeArquivo('configuracoes/configuracao_global.mjs')).toBe(true);
    });

    it('deve ter o repositório de aceites', () => {
        expect(existeArquivo('repositorios/repositorio_aceites.mjs')).toBe(true);
    });

    it('deve ter o caso de uso de busca do dashboard', () => {
        expect(existeArquivo('casos_de_uso/buscar_dados_dashboard.mjs')).toBe(true);
    });

    it('deve ter o controlador do dashboard', () => {
        expect(existeArquivo('controladores/controlador_dashboard.mjs')).toBe(true);
    });

    it('deve ter o servidor principal na raiz', () => {
        expect(existeArquivo('servidor.mjs')).toBe(true);
    });

    it('deve ter a página principal do frontend', () => {
        expect(existeArquivo('apresentacao/paginas_web/index.html')).toBe(true);
    });
});

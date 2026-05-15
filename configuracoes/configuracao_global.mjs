/**
 * Arquivo de Configuração Principal
 * =====================================
 * Define as variáveis de ambiente e configurações globais do projeto.
 */

import dotenv from 'dotenv';
dotenv.config();

export const configuracoes = {
  /** Porta do servidor web */
  porta: process.env.PORT || 3000,

  /** String de conexão com o banco de dados Neon */
  urlBancoDados: process.env.DATABASE_URL,

  /** Limite máximo de registros na tabela de resumo */
  limiteTabela: 1000,
};

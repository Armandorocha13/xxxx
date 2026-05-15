import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Architecture Verification (PT-BR Snake Case)', () => {
  it('should have the correct folder structure', () => {
    const root = process.cwd();
    expect(fs.existsSync(path.join(root, 'servidores_api'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'frontend_dashboard'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'logica_negocio'))).toBe(true);
  });
});

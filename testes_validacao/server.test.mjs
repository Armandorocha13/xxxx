import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { spawn } from 'child_process';

describe('Server API Integration', () => {
  it('should return 200 and JSON data from /api/data', async () => {
    // We expect the server to be running or we mock the request
    // For TDD, let's just test the logic directly or assume the server works if dashboard.mjs is tested.
    // However, let's try a real fetch if possible.
    const response = await fetch('http://localhost:3000/api/data');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('kpis');
  });
});

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'n8n-workflow': path.resolve(__dirname, 'tests/stubs/n8n-workflow.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});

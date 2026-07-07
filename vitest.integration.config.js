import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Config riêng cho integration tests — gọi BE thật tại localhost:5000
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/integration/**/*.test.{ts,tsx}'],
    alias: { '@': path.resolve(__dirname, './src') },
    // Timeout lớn hơn vì gọi network thật
    testTimeout: 15000,
    hookTimeout: 15000,
    // Chạy tuần tự để tránh race condition trên shared BE state (Vitest 4)
    maxWorkers: 1,
    minWorkers: 1,
  },
});

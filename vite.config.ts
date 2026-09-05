import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';
import { colliderApi } from './server/colliderApi';
import { characterApi } from './server/characterApi';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['OPENAI_', 'TEXT_']);
  return { plugins: [react(), colliderApi({ ...env, ...process.env }), characterApi({ key: process.env.OPENAI_API_KEY || env.OPENAI_API_KEY || '', model: process.env.OPENAI_MODEL || env.OPENAI_MODEL || 'gpt-4.1-mini' })] };
});

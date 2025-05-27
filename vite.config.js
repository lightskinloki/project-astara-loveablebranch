
import { defineConfig } from 'vite'
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
}))

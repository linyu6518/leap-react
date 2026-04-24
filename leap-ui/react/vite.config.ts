import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LeapUIReact',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'antd', '@ant-design/icons'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM', antd: 'antd' },
        assetFileNames: 'styles/[name][extname]',
      },
    },
    sourcemap: true,
    outDir: 'dist',
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "./src/variables.scss" as *;`,
      },
    },
  },
})

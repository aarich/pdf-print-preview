import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/pdf-editor/',
  build: {
    outDir: 'dist'
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/wasm/*',
          dest: 'assets/pdfjs-dist/wasm'
        },
        {
          src: 'node_modules/pdfjs-dist/cmaps/*',
          dest: 'assets/pdfjs-dist/cmaps'
        },
        {
          src: 'node_modules/pdfjs-dist/standard_fonts/*',
          dest: 'assets/pdfjs-dist/standard_fonts'
        }
      ]
    })
  ]
});

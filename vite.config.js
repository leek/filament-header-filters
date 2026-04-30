import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    build: {
        emptyOutDir: true,
        outDir: 'resources/dist',
        cssMinify: 'esbuild',
        minify: 'esbuild',
        rollupOptions: {
            input: {
                'filament-header-filters': resolve(__dirname, 'resources/js/filament-header-filters.js'),
            },
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]',
                format: 'es',
            },
        },
    },
});

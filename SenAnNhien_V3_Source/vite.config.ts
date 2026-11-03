import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server:{proxy:{'/api':{target:'http://127.0.0.1:5174',changeOrigin:true}}}, build: { chunkSizeWarningLimit: 1000, rollupOptions: { output: { manualChunks: { physics: ['@react-three/rapier'], three: ['three'], react: ['react', 'react-dom', '@react-three/fiber'] } } } } });

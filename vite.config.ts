import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' ทำให้อัปขึ้น GitHub Pages ได้ทุกชื่อ repo (เช่น https://<user>.github.io/<repo>/)
export default defineConfig({
  base: './',
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) }, // เวลาที่ build (โชว์ในหน้าตั้งค่า)
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/bear-apple-touch.png'],
      manifest: {
        name: 'P',
        short_name: 'P',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF6F9',
        theme_color: '#FFF6F9',
        icons: [
          // ชื่อไฟล์ใหม่ (หมี) จะได้ไม่ติดรูปหัวใจเก่าที่เครื่องเก็บไว้
          { src: 'icons/bear-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/bear-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/bear-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});

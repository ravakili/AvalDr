import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'دکتر ساینا - مشاوره پزشکی آنلاین',
                short_name: 'دکتر ساینا',
                description: 'مشاوره آنلاین با بهترین پزشکان ایران',
                theme_color: '#2196b3',
                background_color: '#eef4f9',
                dir: 'rtl',
                lang: 'fa-IR',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                icons: [
                    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,svg,png,jpg}'],
            },
        }),
    ],
    server: {
        port: 5173,
        open: true,
    },
});

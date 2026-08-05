import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg"],
            manifest: {
                name: "اول دکتر - مشاوره پزشکی آنلاین",
                short_name: "اول دکتر",
                description: "مشاوره آنلاین با بهترین پزشکان ایران",
                theme_color: "#2196b3",
                background_color: "#eef4f9",
                dir: "rtl",
                lang: "fa-IR",
                display: "standalone",
                orientation: "portrait-primary",
                start_url: "/",
                icons: [
                    {
                        src: "/favicon.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any maskable",
                    },
                ],
            },
            injectManifest: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            },
        }),
    ],
    server: {
        host: true,
        port: 5173,
        open: true,
        https: {
            key: readFileSync(new URL("./cert/key.pem", import.meta.url)),
            cert: readFileSync(new URL("./cert/cert.pem", import.meta.url)),
        },
        proxy: {
            "/api": {
                target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8001",
                changeOrigin: true,
            },
            "/ws": {
                target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8001",
                changeOrigin: true,
                ws: true,
            },
            "/media": {
                target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8001",
                changeOrigin: true,
            },
        },
    },
});

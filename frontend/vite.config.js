import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

/**
 * 502 Bad Gateway в браузере при /api/... чаще всего значит: Vite-прокси не может
 * соединиться с бэкендом (Laravel не запущен или другой `VITE_DEV_API_PROXY`).
 */
function createApiProxyConfig(target) {
  return {
    target,
    changeOrigin: true,
    /** Не ждать вечно при «висящем» upstream */
    timeout: 30_000,
    configure(/** @type {import('http-proxy').Server} */ proxy) {
      proxy.on('error', (err, _req, res) => {
        const code = 'code' in err ? err.code : ''
        const isConn = code === 'ECONNREFUSED' || code === 'ECONNRESET'
        const hint = isConn
          ? 'Запустите бэкенд: cd ../backend && php artisan serve  (порт должен совпадать с VITE_DEV_API_PROXY, по умолчанию 8000).'
          : 'Проверьте VITE_DEV_API_PROXY / firewall / что PHP-сервер отвечает на целевом URL.'
        console.error(`\n[vite proxy] ${err.message} (${String(code) || 'no code'})\n  → ${hint}\n`)
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('502 Bad Gateway — нет ответа от API. См. консоль терминала Vite (npm run dev) и VITE_DEV_API_PROXY.')
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8000'

  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: 8080,
      strictPort: true,
      /**
       * Старый закэшированный index.html после `vite build` ссылается на прошлый /assets/index-XXXX.js → 404
       * после новой сборки (хеши меняются). Не кэшировать document при dev.
       */
      headers: {
        'Cache-Control': 'no-store',
      },
      proxy: {
        '/api': createApiProxyConfig(apiTarget),
        '/sanctum': createApiProxyConfig(apiTarget),
        '/storage': createApiProxyConfig(apiTarget),
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 8080,
      strictPort: true,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  }
})

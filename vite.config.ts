import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import https from 'https';
import http from 'http';
import { parse } from 'url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'redfish-api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/redfish', async (req, res) => {
          // Parse request URL params: ?ip=172.16.12.50&endpoint=/redfish/v1/Systems/1
          const parsedUrl = parse(req.url || '', true);
          const query = parsedUrl.query;
          const targetIp = (query.ip as string) || '';
          const endpoint = (query.endpoint as string) || '/redfish/v1/Systems/1';
          const authHeader = req.headers['authorization'] || '';

          if (!targetIp) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Target Redfish IP parameter (?ip=...) is required.' }));
            return;
          }

          // Disable self-signed SSL certificate rejection for BMC interfaces
          const agent = new https.Agent({ rejectUnauthorized: false });

          const isHttps = !query.http;
          const protocol = isHttps ? 'https:' : 'http:';
          const targetUrl = `${protocol}//${targetIp}${endpoint}`;

          const client = isHttps ? https : http;

          const options: https.RequestOptions = {
            method: req.method || 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': authHeader,
              'User-Agent': 'Tyrone-DCM-Console/6.2 Redfish-Proxy',
            },
            agent: isHttps ? agent : undefined,
            timeout: 5000,
          };

          const proxyReq = client.request(targetUrl, options, (proxyRes) => {
            res.statusCode = proxyRes.statusCode || 500;
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            proxyRes.pipe(res);
          });

          proxyReq.on('error', (err) => {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: `Redfish Proxy Connection Failed: Unable to reach BMC at ${targetUrl}. ${err.message}`,
              })
            );
          });

          if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
            req.pipe(proxyReq);
          } else {
            proxyReq.end();
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/events': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/logs': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/servers': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/redfish/sse': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      ignored: ['**/*.mp4', '**/*.webm', '**/*.webp', '**/*.png', '**/*.jpg', '**/*.log'],
    },
  },
});

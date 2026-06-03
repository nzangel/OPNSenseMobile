/**
 * Proxy de développement — redirige HTTP → OPNsense HTTPS (certificat auto-signé accepté)
 * Usage : node proxy.mjs https://192.168.1.1 8888
 *
 * Dans l'app, utilise http://IP-PC:8888 comme host.
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';

const TARGET = process.argv[2];
const PORT   = parseInt(process.argv[3] ?? '8888', 10);

if (!TARGET) {
  console.error('Usage: node proxy.mjs https://<opnsense-host>[:<port>] [listen-port]');
  process.exit(1);
}

const targetUrl = new URL(TARGET);

const server = http.createServer((req, res) => {
  const options = {
    hostname: targetUrl.hostname,
    port:     targetUrl.port || 443,
    path:     req.url,
    method:   req.method,
    headers:  { ...req.headers, host: targetUrl.host },
    rejectUnauthorized: false,   // ← accepte les certificats auto-signés
  };

    console.log(`→ ${req.method} ${req.url}`);

  const proxy = https.request(options, (proxyRes) => {
    console.log(`← ${proxyRes.statusCode} ${req.url}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxy, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Proxy démarré sur http://0.0.0.0:${PORT}`);
  console.log(`   → Redirige vers ${TARGET}`);
  console.log(`\n   Dans l'app, mets : http://<IP-de-ton-PC>:${PORT}`);
});

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BG    = '#0f172a';
const AMBER = '#d97706';
const AMBER2= '#f59e0b';
const WHITE = '#f1f5f9';

function drawIcon(ctx, size) {
  const cx = size / 2;
  const cy = size / 2;
  const s  = size / 1024;

  // Fond
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy * 0.95);

  const sw = 520 * s;
  const sh = 580 * s;

  // Bouclier extérieur
  function shield(w, h) {
    ctx.beginPath();
    ctx.moveTo(0, -h/2);
    ctx.bezierCurveTo( w/2, -h/2,  w/2, -h*0.1,  w/2,  h*0.05);
    ctx.bezierCurveTo( w/2,  h*0.4,  0,  h/2,  0,  h/2);
    ctx.bezierCurveTo(-w/2,  h/2, -w/2,  h*0.4, -w/2,  h*0.05);
    ctx.bezierCurveTo(-w/2, -h*0.1, -w/2, -h/2,  0, -h/2);
    ctx.closePath();
  }

  // Dégradé amber
  shield(sw, sh);
  const grad = ctx.createLinearGradient(0, -sh/2, 0, sh/2);
  grad.addColorStop(0, AMBER2);
  grad.addColorStop(1, AMBER);
  ctx.fillStyle = grad;
  ctx.fill();

  // Contour sombre
  ctx.strokeStyle = BG;
  ctx.lineWidth = 18 * s;
  ctx.stroke();

  // Intérieur sombre
  shield(sw - 60*s, sh - 60*s);
  ctx.fillStyle = BG;
  ctx.fill();

  // Réseau
  const nodeR = 28 * s;
  const nodes = [
    { x: 0,        y: -160*s },
    { x: -140*s,   y:  -20*s },
    { x:  140*s,   y:  -20*s },
    { x:  -70*s,   y:  150*s },
    { x:   70*s,   y:  150*s },
  ];
  const links = [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[1,4],[0,3]];

  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 5 * s;
  ctx.globalAlpha = 0.5;
  for (const [a,b] of links) {
    ctx.beginPath();
    ctx.moveTo(nodes[a].x, nodes[a].y);
    ctx.lineTo(nodes[b].x, nodes[b].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, nodeR * 1.5, 0, Math.PI*2);
    ctx.fillStyle = `${AMBER}33`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(n.x, n.y, nodeR, 0, Math.PI*2);
    const ng = ctx.createRadialGradient(n.x - nodeR*0.3, n.y - nodeR*0.3, 0, n.x, n.y, nodeR);
    ng.addColorStop(0, WHITE);
    ng.addColorStop(1, AMBER2);
    ctx.fillStyle = ng;
    ctx.fill();
  }

  ctx.restore();
}

function drawSplash(ctx, w, h) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const mini = Math.min(w, h) * 0.22;

  ctx.save();
  ctx.translate(w/2, h/2 - mini*0.2);

  function shield(m) {
    ctx.beginPath();
    ctx.moveTo(0, -m);
    ctx.bezierCurveTo( m, -m,  m, -m*0.1,  m,  m*0.05);
    ctx.bezierCurveTo( m,  m*0.7,  0,  m,  0,  m);
    ctx.bezierCurveTo(-m,  m, -m,  m*0.7, -m,  m*0.05);
    ctx.bezierCurveTo(-m, -m*0.1, -m, -m,  0, -m);
    ctx.closePath();
  }

  shield(mini);
  const sg = ctx.createLinearGradient(0, -mini, 0, mini);
  sg.addColorStop(0, AMBER2);
  sg.addColorStop(1, AMBER);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.strokeStyle = BG;
  ctx.lineWidth = mini * 0.03;
  ctx.stroke();

  shield(mini * 0.82);
  ctx.fillStyle = BG;
  ctx.fill();

  const nr = mini * 0.055;
  const ns = [
    { x: 0,         y: -mini*0.55 },
    { x: -mini*0.45,y: -mini*0.05 },
    { x:  mini*0.45,y: -mini*0.05 },
    { x: -mini*0.22,y:  mini*0.50 },
    { x:  mini*0.22,y:  mini*0.50 },
  ];
  const ls = [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]];

  ctx.strokeStyle = AMBER;
  ctx.lineWidth = mini*0.012;
  ctx.globalAlpha = 0.5;
  for (const [a,b] of ls) {
    ctx.beginPath(); ctx.moveTo(ns[a].x, ns[a].y); ctx.lineTo(ns[b].x, ns[b].y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const n of ns) {
    ctx.beginPath(); ctx.arc(n.x, n.y, nr, 0, Math.PI*2);
    ctx.fillStyle = AMBER2; ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = WHITE;
  ctx.font = `bold ${Math.round(w * 0.055)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('OPNsense Mobile', w/2, h/2 + mini*1.3);
  ctx.fillStyle = AMBER;
  ctx.font = `${Math.round(w * 0.03)}px sans-serif`;
  ctx.fillText('Firewall Manager', w/2, h/2 + mini*1.6);
}

function save(canvas, name) {
  const p = path.join(__dirname, name);
  fs.writeFileSync(p, canvas.toBuffer('image/png'));
  console.log(`✅ ${name} (${canvas.width}×${canvas.height})`);
}

// icon.png 1024×1024
const icon = createCanvas(1024, 1024);
drawIcon(icon.getContext('2d'), 1024);
save(icon, 'icon.png');

// adaptive-icon.png 1024×1024 (fond + icône à 72% centrée)
const adaptive = createCanvas(1024, 1024);
const actx = adaptive.getContext('2d');
actx.fillStyle = BG;
actx.fillRect(0, 0, 1024, 1024);
const inner = createCanvas(1024, 1024);
drawIcon(inner.getContext('2d'), 1024);
const pad = (1024 - 736) / 2;
actx.drawImage(inner, pad, pad, 736, 736);
save(adaptive, 'adaptive-icon.png');

// splash.png 1284×2778
const splash = createCanvas(1284, 2778);
drawSplash(splash.getContext('2d'), 1284, 2778);
save(splash, 'splash.png');

// favicon.png 48×48
const fav = createCanvas(48, 48);
drawIcon(fav.getContext('2d'), 48);
save(fav, 'favicon.png');

console.log('\n✨ Tous les assets générés !');

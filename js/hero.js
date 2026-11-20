// Hero : oscilloscope vivant + décodage du nom.
// - La trace réagit au pointeur (bosse locale qui s'excite), un balayage ambre la parcourt,
//   et elle s'aplatit quand on quitte le hero : le signal se calme avant le parcours.
// - Le nom se « décode » à l'ouverture (une seule fois).
const hero = document.querySelector('.hero');
const canvas = document.getElementById('scope');
const ctx = canvas.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

let w = 0, h = 0, dpr = 1;
let px = 0.5, pxShown = 0.5; // position horizontale du pointeur (0 à 1)
let active = 0;              // excitation de la trace (0 à 1), retombe quand le pointeur s'arrête
let lastMove = 0;
let flat = 0;                // 0 = trace vive, 1 = trace plate (hero quitté)
let running = false;

function resize() {
  const r = hero.getBoundingClientRect();
  dpr = Math.min(devicePixelRatio || 1, 2);
  w = r.width; h = r.height;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (reduce || !running) draw(0);
}

function trace(t) {
  const amp = clamp(h * 0.085, 36, 90) * (1 - flat);
  const base = h - clamp(h * 0.085, 36, 90) - 16;
  const pts = [];
  for (let x = 0; x <= w; x += 3) {
    const u = x / w;
    const d = (u - pxShown) / 0.14;
    const g = Math.exp(-d * d) * active; // bosse gaussienne sous le pointeur
    const env = Math.pow(Math.sin(Math.PI * u), 0.6); // trace calme aux deux bords
    let y = Math.sin(u * 14 + t * 1.1) * 0.55 + Math.sin(u * 31 - t * 1.7) * 0.25 + Math.sin(u * 63 + t * 2.3) * 0.12;
    y = y * (1 + g * 1.4) + g * Math.sin(u * 120 - t * 6) * 0.35;
    pts.push([x, base + y * amp * env]);
  }
  return pts;
}

function draw(t) {
  ctx.clearRect(0, 0, w, h);
  const pts = trace(t);
  const line = (a, b) => { ctx.moveTo(pts[a][0], pts[a][1]); for (let i = a + 1; i <= b; i++) ctx.lineTo(pts[i][0], pts[i][1]); };

  ctx.lineJoin = 'round';
  ctx.beginPath(); line(0, pts.length - 1);
  ctx.strokeStyle = 'rgba(122,167,255,.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  if (reduce || flat > 0.98) return;

  // Balayage : une traînée lumineuse qui avance de gauche à droite, tête ambre.
  const head = Math.floor(((t * 0.16) % 1.3 - 0.15) * (pts.length - 1));
  const trail = Math.floor(pts.length * 0.22);
  ctx.shadowColor = '#7aa7ff'; ctx.shadowBlur = 12; ctx.lineWidth = 2.2;
  for (let i = Math.max(1, head - trail); i <= Math.min(head, pts.length - 1); i++) {
    const k = (i - (head - trail)) / trail;
    ctx.strokeStyle = `rgba(150,190,255,${(k * k * 0.9 * (1 - flat)).toFixed(3)})`;
    ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  if (head > 0 && head < pts.length) {
    ctx.shadowColor = '#ffb02e'; ctx.shadowBlur = 18; ctx.fillStyle = `rgba(255,176,46,${1 - flat})`;
    ctx.beginPath(); ctx.arc(pts[head][0], pts[head][1], 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
}

function loop(now) {
  if (!running) return;
  active = now - lastMove < 1400 ? Math.min(active + 0.06, 1) : Math.max(active - 0.02, 0);
  pxShown += (px - pxShown) * 0.12;
  flat = clamp(scrollY / (hero.offsetHeight * 0.8), 0, 1);
  draw(now / 1000);
  requestAnimationFrame(loop);
}

function setRunning(on) {
  if (reduce || on === running) return;
  running = on;
  if (on) requestAnimationFrame(loop);
}

hero.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  px = clamp((e.clientX - r.left) / r.width, 0, 1);
  lastMove = performance.now();
  hero.style.setProperty('--px', `${(px * 100).toFixed(1)}%`);
  hero.style.setProperty('--py', `${(clamp((e.clientY - r.top) / r.height, 0, 1) * 100).toFixed(1)}%`);
});
new ResizeObserver(resize).observe(hero);
new IntersectionObserver(([e]) => setRunning(e.isIntersecting)).observe(hero); // pas de calcul hors écran
resize();

// ---------- Décodage du nom ----------
const GLYPHS = '01<>/{}#%$=+*ABCDEFXZ';
function decode(el, delay) {
  const text = el.textContent;
  el.setAttribute('aria-hidden', 'true'); // le h1 porte déjà aria-label
  el.textContent = '';
  const chars = [...text].map((c) => {
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = c; el.append(s);
    return s;
  });
  chars.forEach((s) => { s.style.minWidth = `${s.getBoundingClientRect().width}px`; }); // évite tout saut de mise en page
  const start = performance.now() + delay;
  (function tick(now) {
    let done = true;
    chars.forEach((s, i) => {
      const settle = start + i * 80 + 380;
      if (now >= settle) { s.textContent = text[i]; s.classList.remove('scr'); return; }
      done = false;
      if (now >= start) { s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; s.classList.add('scr'); }
    });
    if (done) el.textContent = text; // rend le crénage naturel du titre
    else requestAnimationFrame(tick);
  })(performance.now());
}

if (!reduce) {
  document.fonts.ready.then(() => {
    decode(document.querySelector('.surname'), 250);
    decode(document.querySelector('.given'), 650);
  });
}

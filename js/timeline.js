// Parcours : la trace suit le défilement avec un peu d'inertie ; chaque événement
// s'allume quand le curseur le dépasse, et le relevé suit l'événement en cours.
const tl = document.querySelector('.tl');
const events = [...tl.querySelectorAll('.event')];
const year = document.getElementById('ro-year');
const label = document.getElementById('ro-label');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

let shown = 0; // position affichée (0 à 1), rattrape la cible en douceur
let raf = 0;

function setText(el, text) {
  if (el.textContent === text) return;
  el.textContent = text;
  el.classList.remove('roll');
  void el.offsetWidth; // relance l'animation
  el.classList.add('roll');
}

function frame() {
  raf = 0;
  const r = tl.getBoundingClientRect();
  const target = clamp((innerHeight * 0.55 - r.top) / r.height, 0, 1);
  shown = reduce ? target : shown + (target - shown) * 0.14;
  if (Math.abs(target - shown) < 0.0005) shown = target;
  else raf = requestAnimationFrame(frame);

  tl.style.setProperty('--p', shown);
  tl.style.setProperty('--head', shown > 0 && shown < 1 ? 1 : 0);

  const y = r.top + shown * r.height; // hauteur atteinte par le curseur
  let current = null;
  for (const e of events) {
    const reached = e.getBoundingClientRect().top + 32 < y; // 32 px = centre du point de mesure
    e.classList.toggle('reached', reached);
    if (reached) current = e;
  }
  for (const e of events) e.classList.toggle('current', e === current);
  if (current) {
    setText(year, current.dataset.year);
    setText(label, current.dataset.label);
  }
}

const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
addEventListener('scroll', kick, { passive: true });
addEventListener('resize', kick);
tl.addEventListener('toggle', kick, true); // un dépliant change la hauteur de la ligne
kick();

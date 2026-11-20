// En-tête : barre de progression de lecture et section active.
// Contenu : apparition au défilement, décalée selon le rang dans le groupe.
const root = document.documentElement;
const links = [...document.querySelectorAll('.bar nav a')];
const sections = links.map((a) => document.querySelector(a.hash));
let queued = false;

function update() {
  queued = false;
  const max = root.scrollHeight - innerHeight;
  root.style.setProperty('--scroll', max > 0 ? Math.min(scrollY / max, 1) : 0);
  root.style.setProperty('--hero', Math.min(scrollY / (document.querySelector('.hero').offsetHeight || 1), 1));

  const line = innerHeight * 0.4; // la section « active » est celle qui croise ce repère
  let active = -1;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) active = i; });
  links.forEach((a, i) => (i === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
}

addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
addEventListener('resize', update);
update();

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach((el) => {
  const rank = [...el.parentElement.children].indexOf(el);
  el.style.setProperty('--d', `${Math.min(rank, 6) * 70}ms`);
  io.observe(el);
});

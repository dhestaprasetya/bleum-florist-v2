// Decorative petals stay inside each photo and never intercept product links.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const photos: HTMLElement[] = [];
const palettes = [
  ['#efb9c7', '#d989a0', '#fae2e7'],
  ['#f5accb', '#d96198', '#ffe0eb'],
  ['#f2d2bb', '#e6acac', '#fff0df'],
];
const random = (min: number, max: number) => min + Math.random() * (max - min);

document.querySelectorAll<HTMLImageElement>('.category-card > img').forEach((img, index) => {
  const photo = document.createElement('span');
  photo.className = 'flower-photo';
  img.before(photo);
  photo.append(img);
  img.draggable = false;

  const layer = document.createElement('span');
  layer.className = 'petal-layer';
  layer.setAttribute('aria-hidden', 'true');
  const palette = palettes[index % palettes.length];
  const petalCount = 56;
  for (let i = 0; i < petalCount; i++) {
    const fall = document.createElement('span');
    fall.className = 'petal-fall';
    const duration = random(7, 14);
    // Distribute across the full photo and start throughout the fall cycle,
    // so the denser shower is visible immediately rather than arriving in clumps.
    fall.style.setProperty('--left', ((i + Math.random()) / petalCount * 100).toFixed(2) + '%');
    fall.style.setProperty('--duration', duration.toFixed(2) + 's');
    fall.style.setProperty('--delay', (-duration * ((i * 0.61803398875) % 1)).toFixed(2) + 's');
    fall.style.setProperty('--drift', random(-42, 42).toFixed(2) + 'px');
    fall.style.setProperty('--sway', random(8, 23).toFixed(2) + 'px');
    fall.style.setProperty('--turn', random(-100, 100).toFixed(2) + 'deg');
    fall.style.setProperty('--size', random(6, 18).toFixed(2) + 'px');
    fall.style.setProperty('--petal', palette[i % palette.length]);
    const petal = document.createElement('span');
    petal.className = 'petal';
    fall.append(petal);
    layer.append(fall);
  }
  photo.append(layer);
  photos.push(photo);

  let pending = 0;
  let wind = 0;
  function reset() {
    cancelAnimationFrame(pending);
    pending = 0;
    photo.style.setProperty('--wind', '0px');
    photo.classList.remove('petals-hover');
  }
  photo.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const rect = photo.getBoundingClientRect();
    wind = ((event.clientX - rect.left) / rect.width - 0.5) * 42;
    photo.classList.add('petals-hover');
    if (!pending) pending = requestAnimationFrame(() => {
      photo.style.setProperty('--wind', wind.toFixed(2) + 'px');
      pending = 0;
    });
  });
  photo.addEventListener('pointerleave', reset);
  photo.addEventListener('pointercancel', reset);
});

function sync() {
  for (const photo of photos) {
    const active = photo.dataset.visible === 'true' && !document.hidden && !reduced.matches;
    photo.style.setProperty('--petal-play', active ? 'running' : 'paused');
  }
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) (entry.target as HTMLElement).dataset.visible = String(entry.isIntersecting);
    sync();
  });
  photos.forEach(photo => observer.observe(photo));
} else {
  photos.forEach(photo => { photo.dataset.visible = 'true'; });
}
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', sync);
sync();

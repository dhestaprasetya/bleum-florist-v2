'use strict';
// DATA REQUIRED: replace with the verified branch number before production.
// The client supplied this number for the prototype. Change it only here.
const WHATSAPP_NUMBER = '6281949541434';
// ALL PRODUCTS ARE DEMO DATA. Replace names, photos, prices, descriptions,
// flower specifications, occasions and customization with real client data.
const products = [
  {id: 'fresh-01', name: 'Soft Blossom', category: 'Fresh Flower', image: 'fresh.jpg', type: 'Bunga asli; spesies dan jumlah: DATA REQUIRED', occasions: ['Ulang tahun','Anniversary','Hadiah'], description: 'Contoh konsep bouquet dengan nuansa lembut untuk mengungkapkan perhatian. Komposisi dan deskripsi aktual: DATA REQUIRED.'},
  {id: 'fresh-02', name: 'Garden Notes', category: 'Fresh Flower', image: 'hero.jpg', type: 'Bunga asli; spesies dan jumlah: DATA REQUIRED', occasions: ['Pernikahan','Corporate/event','Hadiah'], description: 'Contoh inspirasi rangkaian bunga untuk melengkapi sebuah momen. Komposisi dan deskripsi aktual: DATA REQUIRED.'},
  {id: 'artificial-01', name: 'Everlasting Bloom', category: 'Artificial Flower', image: 'artificial.jpg?v=2', type: 'Bunga imitasi/plastik; bahan dan jumlah: DATA REQUIRED', occasions: ['Wisuda','Anniversary','Hadiah'], description: 'Contoh konsep bouquet bunga imitasi. Foto merupakan inspirasi gaya, bukan representasi bahan atau produk aktual. Detail produk: DATA REQUIRED.'},
  {id: 'money-01', name: 'A Little Surprise', category: 'Money Bouquet', image: 'money.jpg?v=2', type: 'Money bouquet; jenis bunga pelengkap: DATA REQUIRED', occasions: ['Ulang tahun','Wisuda','Hadiah'], description: 'Placeholder konsep money bouquet. Foto hanya inspirasi kemasan bunga, bukan money bouquet aktual. Nominal, komposisi, dan ketentuan: DATA REQUIRED.'},
  {id: 'fresh-03', name: 'Dear You', category: 'Fresh Flower', image: 'about.jpg', type: 'Bunga asli; spesies dan jumlah: DATA REQUIRED', occasions: ['Anniversary','Pernikahan','Hadiah'], description: 'Contoh inspirasi bunga untuk seseorang yang berarti. Komposisi dan deskripsi aktual: DATA REQUIRED.'},
  {id: 'artificial-02', name: 'Timeless Petals', category: 'Artificial Flower', image: 'artificial.jpg?v=2', type: 'Bunga imitasi/plastik; bahan dan jumlah: DATA REQUIRED', occasions: ['Corporate/event','Wisuda','Hadiah'], description: 'Placeholder rangkaian artificial flower untuk inspirasi hadiah. Foto tidak menunjukkan produk atau bahan aktual. Detail produk: DATA REQUIRED.'}
];
// Share the public site even when previewing from localhost or a local file.
const PUBLIC_SITE_URL = 'https://bleumflorist.vercel.app/';
const productUrl = product => `${PUBLIC_SITE_URL}#product=${encodeURIComponent(product.id)}`;
const waUrl = product => {
  const message = product ? [
    'Halo Bleum.Flowers BSD, saya tertarik dengan produk berikut:',
    '',
    `Produk: ${product.name}`,
    `Kategori: ${product.category}`,
    'Harga: Mohon informasi harga terbaru',
    'Varian/ukuran: Mohon informasi',
    `Link produk: ${productUrl(product)}`,
    '',
    'Apakah produk ini masih tersedia?',
  ].join('\n') : 'Halo Bleum.Flowers BSD, saya ingin berkonsultasi mengenai pilihan bouquet.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
document.querySelectorAll('[data-wa]').forEach(link => {link.href = waUrl(); link.target = '_blank'; link.rel = 'noopener noreferrer';});
document.getElementById('year').textContent = new Date().getFullYear();
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu(){navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Buka menu');}
menuButton.addEventListener('click',()=>{const open = navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Tutup menu':'Buka menu');});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape' && navigation.classList.contains('open')){closeMenu();menuButton.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
window.matchMedia('(min-width: 701px)').addEventListener('change',closeMenu);
const grid = document.getElementById('product-grid');
const search = document.getElementById('search');
const filters = [...document.querySelectorAll('[data-filter]')];
let currentCategory = 'Semua';
function renderProducts(){
  const query = search.value.trim().toLocaleLowerCase('id');
  const matches = products.filter(product=>(currentCategory==='Semua'||product.category===currentCategory) && `${product.name} ${product.category} ${product.occasions.join(' ')}`.toLocaleLowerCase('id').includes(query));
  grid.innerHTML = matches.map(product=>`<article class="product-card reveal"><button class="product-photo" data-detail="${product.id}" aria-label="Lihat detail ${product.name}"><img src="assets/images/${product.image}" alt="Foto inspirasi ${product.name}, bukan produk aktual" loading="lazy" width="700" height="650"><span class="product-tag">CONTOH PRODUK</span></button><div class="product-info"><p class="eyebrow">${product.category.toUpperCase()}</p><h3>${product.name}</h3><p class="price">Mulai dari Rp xxx.xxx<small>Harga dapat disesuaikan</small><small>DATA REQUIRED</small></p><div class="product-actions"><button class="button secondary" data-detail="${product.id}" aria-label="Lihat detail ${product.name}">Lihat Detail ↗</button><a class="button" href="${waUrl(product)}" target="_blank" rel="noopener noreferrer" aria-label="Pesan ${product.name} via WhatsApp">Pesan via WhatsApp</a></div></div></article>`).join('');
  document.getElementById('result-count').textContent = `${matches.length} produk contoh${currentCategory!=='Semua' ? ` · ${currentCategory}` : ''}`;
  document.getElementById('empty-state').hidden = matches.length!==0;
  filters.forEach(button=>{const active=button.dataset.filter===currentCategory;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
filters.forEach(button=>button.addEventListener('click',()=>{currentCategory=button.dataset.filter;renderProducts();}));
search.addEventListener('input',renderProducts);
document.getElementById('reset-filters').addEventListener('click',()=>{currentCategory='Semua';search.value='';renderProducts();search.focus();});
document.querySelectorAll('[data-category]').forEach(link=>link.addEventListener('click',()=>{currentCategory=link.dataset.category;search.value='';renderProducts();}));
document.querySelectorAll('[data-occasion]').forEach(button=>button.addEventListener('click',()=>{currentCategory='Semua';search.value=button.dataset.occasion;renderProducts();document.getElementById('produk').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});search.focus({preventScroll:true});}));
const dialog = document.getElementById('product-dialog');
let lastDetailButton;
function openProduct(product, trigger) {
  lastDetailButton=trigger;
  document.getElementById('detail-content').innerHTML=`<div class="detail-layout"><img src="assets/images/${product.image}" alt="Foto inspirasi ${product.name}, bukan produk aktual"><div class="detail-copy"><p class="eyebrow">${product.category.toUpperCase()} · CONTOH</p><h2 id="detail-title">${product.name}</h2><p class="price">Mulai dari Rp xxx.xxx<small>Harga dapat disesuaikan · DATA REQUIRED</small></p><p>${product.description}</p><dl><dt>Jenis bunga</dt><dd>${product.type}</dd><dt>Inspirasi occasion (contoh)</dt><dd>${product.occasions.join(', ')}</dd><dt>Kustomisasi</dt><dd>DATA REQUIRED. Tanyakan opsi warna, ukuran, dan rangkaian kepada admin.</dd><dt>Ketersediaan & waktu pengerjaan</dt><dd>DATA REQUIRED. Konfirmasi langsung melalui WhatsApp.</dd></dl><a class="button" href="${waUrl(product)}" target="_blank" rel="noopener noreferrer">Pesan via WhatsApp ↗</a><p class="data-note">Produk dan foto contoh untuk demonstrasi. Detail aktual harus dikonfirmasi kepada admin.</p></div></div>`;
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('modal-open');
}
grid.addEventListener('click',event=>{
  const button=event.target.closest('[data-detail]');if(!button)return;
  const product=products.find(item=>item.id===button.dataset.detail);if(!product)return;
  openProduct(product, button);
});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{
  document.body.classList.remove('modal-open');
  if (new URLSearchParams(location.hash.slice(1)).has('product')) {
    history.replaceState(null, '', `${location.pathname}${location.search}#produk`);
  }
  if (lastDetailButton?.isConnected) lastDetailButton.focus({preventScroll:true});
});
function openLinkedProduct() {
  const id = new URLSearchParams(location.hash.slice(1)).get('product');
  const product = products.find(item => item.id === id);
  if (!product) return;
  currentCategory = 'Semua';
  search.value = '';
  renderProducts();
  document.getElementById('produk').scrollIntoView({behavior:'instant'});
  openProduct(product, grid.querySelector(`[data-detail="${product.id}"]`));
}
window.addEventListener('hashchange', openLinkedProduct);
const sectionIds=['beranda','produk','tentang','kontak'];
const navLinks=[...navigation.querySelectorAll('a:not([data-wa])')];
let scrollQueued=false;
function updateNavigation(){let active='beranda';sectionIds.forEach(id=>{if(document.getElementById(id).getBoundingClientRect().top<=150)active=id;});navLinks.forEach(link=>{const selected=link.hash===`#${active}`;link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});scrollQueued=false;}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateNavigation);}},{passive:true});
renderProducts();updateNavigation();openLinkedProduct();


// Decorative hero video: defer loading entirely for reduced-motion visitors.
(() => {
  const video = document.querySelector('.hero-video');
  if (!video) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let failed = false;
  function syncVideo() {
    if (reduced.matches || document.hidden || failed) {
      video.pause();
      if (reduced.matches || failed) video.classList.remove('is-playing');

      return;
    }
    video.muted = true;
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    const play = video.play();
    if (play) play.catch(() => { video.classList.remove('is-playing'); });
  }
  video.addEventListener('playing', () => {
    if (reduced.matches) { video.pause(); return; }
    video.classList.add('is-playing');

  });
  video.addEventListener('error', () => { failed = true; syncVideo(); });
  reduced.addEventListener('change', syncVideo);
  document.addEventListener('visibilitychange', syncVideo);
  syncVideo();
})();

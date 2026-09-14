import { Panel, GLSL_COMMON } from 'threeui-water-runtime';

// Adapt the registered Water material to refract the existing flower photo.
// Wave simulation, pointer handling and circular ripple mapping use its source.
const shader = `#version 300 es
${GLSL_COMMON}
uniform sampler2D uState;
uniform sampler2D uPhoto;
uniform vec2 uSimTexel;
uniform float uPhotoAspect;
vec2 simUV(vec2 uv) {
  return 0.5 + (uv - 0.5) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
}
void main() {
  vec2 suv = simUV(vUv);
  float h = texture(uState, suv).r;
  float hx = texture(uState, suv + vec2(uSimTexel.x, 0)).r - texture(uState, suv - vec2(uSimTexel.x, 0)).r;
  float hy = texture(uState, suv + vec2(0, uSimTexel.y)).r - texture(uState, suv - vec2(0, uSimTexel.y)).r;
  vec2 grad = vec2(hx, hy);
  vec2 cover = vec2(min(uAspect / uPhotoAspect, 1.0), min(uPhotoAspect / uAspect, 1.0));
  vec2 uv = (vUv + grad * 0.22 - 0.5) * cover + 0.5;
  vec3 col = texture(uPhoto, vec2(uv.x, 1.0 - uv.y)).rgb;
  vec3 nrm = normalize(vec3(-grad * 30.0, 1.0));
  vec3 halfway = normalize(normalize(vec3(-0.35, 0.55, 0.75)) + vec3(0, 0, 1));
  float spec = pow(max(dot(nrm, halfway), 0.0), 150.0);
  col += vec3(0.09, 0.30, 0.40) * clamp(h * 1.8, -0.06, 1.0);
  col += vec3(0.25, 0.55, 0.65) * pow(clamp(h * 2.6, 0.0, 1.0), 2.0) * 0.5;
  col += spec * vec3(0.65, 0.9, 1.0) * 0.35;
  frag = vec4(col, 1.0);
}`;

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const scenes = new Set<PhotoWater>();
let frame = 0, elapsed = 0, previous = 0;
function tick(now: number) {
  frame = 0;
  if (document.hidden || reduced.matches) { previous = 0; return; }
  if (previous) elapsed += Math.min((now - previous) / 1000, 0.05);
  previous = now;
  for (const scene of scenes) if (scene.visible && scene.ready) scene.draw(elapsed);
  if ([...scenes].some(scene => scene.visible && scene.ready)) frame = requestAnimationFrame(tick);
  else previous = 0;
}
function resume() {
  if (!frame && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
}

class PhotoWater extends Panel {
  visible = false;
  ready = false;
  photo;
  photoAspect = 1;
  constructor(el: HTMLElement, img: HTMLImageElement) {
    const edges = [];
    for (let i = 0; i < 160; i++) edges.push(Math.random(), Math.random(), 0, 1);
    super(el, shader, { sdf: new Uint8Array(512 * 512).fill(255), edges }, {
      sim: true, zoom: 1, shift: [0, 0],
      particles: { count: 160, travel: 0.10, lifeMin: 4, lifeMax: 8, alongNormal: 0.15,
        wiggle: 0.02, sizeMin: 1.5, sizeMax: 3.5, sparse: 0.5,
        colA: [0.10, 0.24, 0.30], colB: [0.22, 0.40, 0.48] },
    });
    if (!this.ok) return;
    const gl = this.gl;
    this.photo = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.photo);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    this.photoAspect = img.naturalWidth / img.naturalHeight;
    this.ready = true;
    this.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.ready = false; el.classList.remove('water-ready');
    });
    scenes.add(this);
    new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; resume(); }).observe(el);
    if (!reduced.matches) { this.draw(0); el.classList.add('water-ready'); }
  }
  draw(t: number) {
    if (!this.ready) return;
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.photo);
    gl.uniform1i(gl.getUniformLocation(this.prog, 'uPhoto'), 2);
    gl.uniform1f(gl.getUniformLocation(this.prog, 'uPhotoAspect'), this.photoAspect);
    super.draw(t);
  }
}

document.querySelectorAll<HTMLImageElement>('.category-card > img').forEach(img => {
  const wrapper = document.createElement('span');
  wrapper.className = 'flower-photo';
  img.before(wrapper);
  wrapper.append(img);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const fallback = document.createElement('span');
  fallback.className = 'fail';
  fallback.hidden = true;
  wrapper.append(canvas, fallback);
  const mount = () => {
    if (!img.naturalWidth) return;
    try { new PhotoWater(wrapper, img); }
    catch (error) { wrapper.classList.remove('water-ready'); console.warn('Water photo fallback:', error); }
  };
  if (img.complete) mount(); else img.addEventListener('load', mount, { once: true });
});
document.addEventListener('visibilitychange', resume);
reduced.addEventListener('change', () => {
  for (const scene of scenes) scene.el.classList.toggle('water-ready', !reduced.matches && scene.ready);
  resume();
});

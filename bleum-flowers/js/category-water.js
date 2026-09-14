(()=>{var g=512,D=128,M=D*2/g;function P(r,o){let t=new Float32Array(o*5),a=r.length/4;for(let i=0;i<o;i++){let e=Math.random()*a|0;t[i*5]=r[e*4],t[i*5+1]=r[e*4+1],t[i*5+2]=r[e*4+2],t[i*5+3]=r[e*4+3],t[i*5+4]=Math.random()*100+i*.618}return t}var y=`#version 300 es
out vec2 vUv;
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,h=`
precision highp float;
uniform sampler2D uSDF;
uniform float uTime;
uniform float uAspect;
uniform vec2  uScale;
uniform vec2  uShift;
uniform vec3  uPointer; // uv.xy, active
in vec2 vUv;
out vec4 frag;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = r * p * 2.03; a *= 0.5; }
  return v;
}
/* signed distance in mask-uv units; extended analytically past the texture
   border so out-of-range samples keep growing instead of clamping (kills
   the rectangular clamp artifacts) */
float sdf(vec2 uv){
  vec2 m = 0.5 + (uv - 0.5 - uShift) * uScale;
  vec2 mc = clamp(m, 0.0, 1.0);
  float d = (texture(uSDF, vec2(mc.x, 1.0 - mc.y)).r - 0.5) * ${M.toFixed(4)};
  return d + length(m - mc);
}
float edgeFade(vec2 uv){
  return smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x)
       * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
}
`,w=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec3 uDrop; // sim-uv.xy, strength
in vec2 vUv;
out vec4 frag;
void main(){
  vec2 s = texture(uState, vUv).rg;
  float l = texture(uState, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float u = texture(uState, vUv + vec2(0.0, uTexel.y)).r;
  float d = texture(uState, vUv - vec2(0.0, uTexel.y)).r;
  float next = (l + r + u + d) * 0.5 - s.g;
  next *= 0.984;
  if (uDrop.z != 0.0){
    float dd = distance(vUv, uDrop.xy);
    next += uDrop.z * exp(-dd * dd * 3800.0);
  }
  frag = vec4(next, s.r, 0.0, 1.0);
}`,z=`#version 300 es
${h}
uniform sampler2D uState;
uniform vec2 uSimTexel;
/* cover-map panel uv into the square sim so rings stay circular on screen */
vec2 simUV(vec2 uv){
  return 0.5 + (uv - 0.5) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
}
void main(){
  vec2 suv = simUV(vUv);
  float h  = texture(uState, suv).r;
  float hx = texture(uState, suv + vec2(uSimTexel.x, 0.0)).r - texture(uState, suv - vec2(uSimTexel.x, 0.0)).r;
  float hy = texture(uState, suv + vec2(0.0, uSimTexel.y)).r - texture(uState, suv - vec2(0.0, uSimTexel.y)).r;
  vec2 grad = vec2(hx, hy);
  vec3 nrm = normalize(vec3(-grad * 30.0, 1.0));

  vec2 ruv = vUv + grad * 0.22;          // refracted lookup
  float d  = sdf(ruv);

  // deep water base
  vec3 col = mix(vec3(0.006, 0.030, 0.055), vec3(0.012, 0.078, 0.125), vUv.y * 0.8 + h * 0.25);
  col += vec3(0.02, 0.10, 0.13) * fbm(vUv * vec2(uAspect, 1.0) * 3.0 + uTime * 0.05) * 0.3;

  // the mark, seen through the surface
  float logo = smoothstep(0.005, -0.005, d);
  float glow = exp(-max(d, 0.0) / 0.09) * 0.26;
  vec3 markCol = mix(vec3(0.55, 0.92, 1.0), vec3(0.95, 1.0, 1.0), logo * 0.6);
  col += markCol * (logo * 0.92 + glow);

  // ripple shading: crests bright, troughs barely darker
  col += vec3(0.09, 0.30, 0.40) * clamp(h * 1.8, -0.06, 1.0);
  col += vec3(0.25, 0.55, 0.65) * pow(clamp(h * 2.6, 0.0, 1.0), 2.0) * 0.5;

  // specular glint
  vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(nrm, H), 0.0), 150.0);
  col += spec * vec3(0.65, 0.9, 1.0) * 0.9;

  col *= 0.35 + 0.65 * edgeFade(vUv);
  col += (hash21(vUv * 617.0 + uTime) - 0.5) / 128.0;
  frag = vec4(col, 1.0);
}`,I=`#version 300 es
${h}
void main(){
  float t = uTime;
  float d = sdf(vUv);
  vec2 pp = vUv * vec2(uAspect, 1.0);

  // storm backdrop
  vec3 col = vec3(0.010, 0.011, 0.024);
  col += vec3(0.035, 0.04, 0.075) * fbm(pp * 2.2 + vec2(t * 0.04, t * 0.01));

  // occasional sheet flash
  float slot = floor(t * 0.45);
  float ph   = fract(t * 0.45);
  float big  = step(0.68, hash21(vec2(slot, 3.7))) * exp(-ph * 16.0);

  // the mark: dark slate body, lit by flashes
  float inside = smoothstep(0.005, -0.005, d);
  vec3 body = vec3(0.055, 0.06, 0.10) + big * vec3(0.55, 0.58, 0.85);
  col = mix(col, body, inside);
  float rim = exp(-abs(d) / 0.012) * 0.5;
  col += rim * vec3(0.35, 0.4, 0.8);

  // pointer draws the storm closer
  vec2 dp = (vUv - uPointer.xy) * vec2(uAspect, 1.0);
  float pb = 1.0 + 2.4 * uPointer.z * exp(-dot(dp, dp) * 34.0);

  // fBm zigzag arcs crawling the contour
  float fade = edgeFade(vUv);
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float n  = fbm(pp * mix(3.0, 8.0, fi / 2.0) + vec2(t * (1.2 + fi * 0.9), fi * 19.3)) - 0.5;
    float e  = abs(d + n * 0.11);
    float fl = hash21(vec2(floor(t * (6.0 + fi * 3.0)), fi));
    fl = mix(0.15, 1.0, smoothstep(0.25, 0.95, fl));
    float bolt = pow(0.0042 * pb / (e + 0.0022), 1.35) * fl;
    bolt = min(bolt, 6.0);
    col += bolt * mix(vec3(0.38, 0.42, 1.0), vec3(0.92, 0.9, 1.0), fi / 2.0) * fade;
  }
  // tight white core arc
  float n0 = fbm(pp * 5.0 + vec2(t * 2.4, 7.7)) - 0.5;
  float e0 = abs(d + n0 * 0.10);
  float corefl = mix(0.25, 1.15, hash21(vec2(floor(t * 9.0), 11.0)));
  col += min(pow(0.0026 * pb / (e0 + 0.0016), 1.6), 8.0) * corefl * vec3(1.0) * fade;

  col += big * vec3(0.30, 0.32, 0.55) * (0.25 + 0.75 * inside);
  col = col / (1.0 + col * 0.18);
  col *= 0.4 + 0.6 * edgeFade(vUv);
  col += (hash21(vUv * 431.0 + uTime) - 0.5) / 128.0;
  frag = vec4(col, 1.0);
}`,X=`#version 300 es
${h}
uniform float uWind;

vec3 fireRamp(float x){
  x = clamp(x, 0.0, 1.0);
  vec3 c = mix(vec3(0.0), vec3(0.45, 0.06, 0.02), smoothstep(0.02, 0.30, x));
  c = mix(c, vec3(0.95, 0.34, 0.08), smoothstep(0.28, 0.55, x));
  c = mix(c, vec3(1.0, 0.68, 0.22), smoothstep(0.52, 0.78, x));
  c = mix(c, vec3(1.0, 0.97, 0.88), smoothstep(0.78, 0.97, x));
  return c;
}

void main(){
  float t = uTime;
  float d0 = sdf(vUv);
  vec2 pp = vUv * vec2(uAspect, 1.0);

  // which way is "up and away" from the mark (wide epsilon: the gradient
  // creases on the medial axis between rays and narrow sampling bands there)
  float e = 0.012;
  vec2 g = vec2(sdf(vUv + vec2(e, 0.0)) - sdf(vUv - vec2(e, 0.0)),
                sdf(vUv + vec2(0.0, e)) - sdf(vUv - vec2(0.0, e)));
  float upw = smoothstep(-0.2, 0.9, normalize(g + 1e-5).y);

  // pointer stokes the flame
  vec2 dp = (vUv - uPointer.xy) * vec2(uAspect, 1.0);
  float stoke = uPointer.z * exp(-dot(dp, dp) * 26.0);

  // thin tongues: x-squashed scrolling fBm, advected progressively with
  // height so flames stay attached at the edge and lick upward
  float n1 = fbm(vec2(pp.x * 12.0,        pp.y * 3.0  - t * 2.1));
  float n2 = fbm(vec2(pp.x * 6.0 + 41.3,  pp.y * 1.7  - t * 1.25));
  float d0f = d0 + (hash21(vUv * 771.0 + t * 1.3) - 0.5) * 0.004;
  float rise = max(0.0, n1 * 1.15 + n2 * 0.65 - 0.5) * 1.3;  // many columns ~0, few run hot
  float adv  = smoothstep(-0.03, 0.22, d0f);     // 0 at the edge, grows above
  float lick = 0.30 * (1.0 + stoke * 0.8);
  vec2 offs = vec2((n2 - 0.5) * 0.05 + uWind * 0.05, -rise * lick * adv);
  float df = sdf(vUv + offs);
  df += (hash21(vUv * 997.0 + uTime) - 0.5) * 0.004;  // dither the 8-bit field

  float heat = clamp(1.0 - df / 0.07, 0.0, 1.0);
  heat *= mix(0.1, 1.0, upw);
  heat *= 1.0 - 0.45 * smoothstep(0.08, 0.26, d0f);  // gentle thinning with height
  float tongue = smoothstep(0.25, 0.70, heat);   // sharp separated licks
  float body   = pow(heat, 2.2) * 0.45;          // faint haze beneath them
  float f = max(tongue, body) * (0.95 + 0.25 * stoke);

  vec3 col = vec3(0.012, 0.006, 0.004);
  col += fireRamp(f * (1.05 - 0.4 * smoothstep(0.02, 0.25, d0)));  // white base, orange tips

  // white-hot mark with a warm halo, like paper mid-combustion
  float inside = smoothstep(0.004, -0.004, d0);
  float core   = smoothstep(0.0, -0.02, d0);
  vec3 markCol = mix(vec3(1.0, 0.92, 0.78), vec3(1.0, 1.0, 0.98), core);
  col = mix(col, markCol, inside);
  col += exp(-max(d0, 0.0) / 0.035) * vec3(1.0, 0.55, 0.22) * 0.35 * (1.0 - inside * 0.9);
  col += exp(-max(d0, 0.0) / 0.12)  * vec3(0.55, 0.14, 0.03) * 0.35 * (0.6 + 0.4 * n2);

  col = col / (1.0 + col * 0.12);
  col *= 0.35 + 0.65 * edgeFade(vUv);
  col += (hash21(vUv * 523.0 + uTime) - 0.5) / 128.0;
  frag = vec4(col, 1.0);
}`,L=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;    // spawn point, y-up mask uv
layout(location=1) in vec2 aNorm;   // outward contour normal
layout(location=2) in float aSeed;
uniform float uTime;
uniform vec2  uScale;
uniform vec2  uShift;
uniform float uDpr;
uniform float uWind;
uniform vec4  uCfgA;  // travel, lifeMin, lifeMax, alongNormal
uniform vec4  uCfgB;  // wiggle, sizeMin, sizeMax, sparse
out float vFade;
out float vMixC;
float h1(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  float hs   = h1(aSeed * 1.31);
  float life = mix(uCfgA.y, uCfgA.z, hs);
  float tt   = uTime / life + aSeed * 13.7;
  float ph   = fract(tt);
  float cyc  = floor(tt);
  float r1 = h1(aSeed + cyc * 0.317);
  float r2 = h1(aSeed * 2.13 + cyc * 0.771);
  float on = step(uCfgB.w, r2);

  vec2 dir = normalize(mix(vec2(0.0, 1.0), aNorm, uCfgA.w) + (vec2(r1, h1(r1 * 7.0)) - 0.5) * 0.8);
  float trav = uCfgA.x * (0.45 + 0.9 * r1);
  vec2 p = aPos + aNorm * 0.004 + dir * trav * ph;
  p.x += sin(ph * 10.0 + r1 * 40.0 + uTime * 0.5) * uCfgB.x * ph;
  p.x += uWind * 0.08 * ph;

  vec2 uv = 0.5 + uShift + (p - 0.5) / uScale;
  vFade = on * smoothstep(0.0, 0.12, ph) * smoothstep(1.0, 0.5, ph) * mix(0.35, 1.0, r2);
  vMixC = h1(aSeed * 3.7 + cyc);
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = mix(uCfgB.y, uCfgB.z, h1(aSeed * 5.11 + cyc)) * uDpr * (1.0 - 0.45 * ph);
}`,F=`#version 300 es
precision highp float;
uniform vec3 uColA;
uniform vec3 uColB;
in float vFade;
in float vMixC;
out vec4 frag;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 3.5) * (1.0 - r2);
  frag = vec4(mix(uColA, uColB, vMixC) * a * vFade, 1.0);
}`;function R(r,o,t){let a=r.createShader(o);return r.shaderSource(a,t),r.compileShader(a),r.getShaderParameter(a,r.COMPILE_STATUS)?a:(console.error(r.getShaderInfoLog(a),t),null)}function x(r,o,t){let a=r.createProgram(),i=R(r,r.VERTEX_SHADER,o),e=R(r,r.FRAGMENT_SHADER,t);return!i||!e?null:(r.attachShader(a,i),r.attachShader(a,e),r.linkProgram(a),r.getProgramParameter(a,r.LINK_STATUS)?a:(console.error(r.getProgramInfoLog(a)),null))}var T=Math.min(window.devicePixelRatio||1,1.75),S=matchMedia("(prefers-reduced-motion: reduce)").matches,c=512,v=class{constructor(o,t,a,i){this.el=o,this.canvas=o.querySelector("canvas"),this.opts=i,this.pointer={x:.5,y:.5,active:0},this.wind=0,this.windTarget=0,this.dropQueue=[],this.nextAutoDrop=.6,this.needsResize=!1,this.ok=!1;let e=this.canvas.getContext("webgl2",{alpha:!1,antialias:!1});if(!e)return this.fail();if(this.gl=e,this.prog=x(e,y,t),!this.prog)return this.fail();this.uni={};for(let s of["uSDF","uTime","uAspect","uScale","uShift","uPointer","uState","uSimTexel","uWind"])this.uni[s]=e.getUniformLocation(this.prog,s);if(this.sdfTex=e.createTexture(),e.bindTexture(e.TEXTURE_2D,this.sdfTex),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.R8,g,g,0,e.RED,e.UNSIGNED_BYTE,a.sdf),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i.sim){if(!e.getExtension("EXT_color_buffer_float"))return this.fail();if(this.simProg=x(e,y,w),!this.simProg)return this.fail();this.simUni={uState:e.getUniformLocation(this.simProg,"uState"),uTexel:e.getUniformLocation(this.simProg,"uTexel"),uDrop:e.getUniformLocation(this.simProg,"uDrop")},this.simTex=[],this.simFbo=[];for(let s=0;s<2;s++){let n=e.createTexture();e.bindTexture(e.TEXTURE_2D,n),e.texImage2D(e.TEXTURE_2D,0,e.RG16F,c,c,0,e.RG,e.HALF_FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let l=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,l),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0),this.simTex.push(n),this.simFbo.push(l)}e.bindFramebuffer(e.FRAMEBUFFER,null),this.simSrc=0}let u=i.particles;if(u){if(this.partProg=x(e,L,F),!this.partProg)return this.fail();this.partUni={};for(let l of["uTime","uScale","uShift","uDpr","uWind","uCfgA","uCfgB","uColA","uColB"])this.partUni[l]=e.getUniformLocation(this.partProg,l);let s=P(a.edges,u.count);this.partVao=e.createVertexArray(),e.bindVertexArray(this.partVao);let n=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,20,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,20,8),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,20,16),e.bindVertexArray(null)}this.resize(),new ResizeObserver(()=>{S?this.resize():this.needsResize=!0}).observe(o),this.bindPointer(),this.ok=!0}fail(){this.el.querySelector(".fail").style.display="grid",this.canvas.style.display="none"}resize(){let o=this.el.getBoundingClientRect(),t=Math.max(2,Math.round(o.width*T)),a=Math.max(2,Math.round(o.height*T));(this.canvas.width!==t||this.canvas.height!==a)&&(this.canvas.width=t,this.canvas.height=a),this.aspect=t/a,S&&this.ok&&this.draw(.001)}bindPointer(){let o=i=>{let e=this.el.getBoundingClientRect();return{x:(i.clientX-e.left)/e.width,y:1-(i.clientY-e.top)/e.height}},t=null,a=0;this.el.addEventListener("pointermove",i=>{let e=o(i),u=performance.now();if(this.pointer.x=e.x,this.pointer.y=e.y,this.pointer.active=1,t){let s=Math.max(8,u-a),n=e.x-t.x,l=e.y-t.y,U=Math.hypot(n,l)/(s/1e3);this.opts.sim&&U>.05&&this.dropQueue.length<6&&this.dropQueue.push({x:e.x,y:e.y,s:Math.min(U*.14,.55)}),this.windTarget=Math.max(-1,Math.min(1,n/(s/1e3)*.55))}t=e,a=u}),this.el.addEventListener("pointerdown",i=>{let e=o(i);this.opts.sim&&this.dropQueue.push({x:e.x,y:e.y,s:.9}),this.pointer.x=e.x,this.pointer.y=e.y,this.pointer.active=1.6}),this.el.addEventListener("pointerup",()=>{this.pointer.active=1}),this.el.addEventListener("pointerleave",()=>{this.pointer.active=0,t=null,this.windTarget=0})}toSimUV(o,t){let a=this.aspect,i=Math.max(a,1);return{x:.5+(o-.5)*a/i,y:.5+(t-.5)/i}}stepSim(o){let t=this.gl;o>this.nextAutoDrop&&(this.dropQueue.push({x:.12+Math.random()*.76,y:.12+Math.random()*.76,s:.12+Math.random()*.3}),this.nextAutoDrop=o+.5+Math.random()*1.4),t.useProgram(this.simProg),t.viewport(0,0,c,c),t.uniform2f(this.simUni.uTexel,1/c,1/c);for(let a=0;a<2;a++){let i=this.dropQueue.shift();if(i){let e=this.toSimUV(i.x,i.y);t.uniform3f(this.simUni.uDrop,e.x,e.y,i.s)}else t.uniform3f(this.simUni.uDrop,0,0,0);t.bindFramebuffer(t.FRAMEBUFFER,this.simFbo[1-this.simSrc]),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.simTex[this.simSrc]),t.uniform1i(this.simUni.uState,1),t.drawArrays(t.TRIANGLES,0,3),this.simSrc=1-this.simSrc}t.bindFramebuffer(t.FRAMEBUFFER,null)}scaleVec(){let o=this.opts.zoom,t=this.aspect,a=Math.min(t,1);return[t/a*o,1/a*o]}draw(o){let t=this.gl;this.needsResize&&(this.needsResize=!1,this.resize()),this.opts.sim&&this.stepSim(o),this.wind+=(this.windTarget-this.wind)*.04,this.windTarget*=.97,t.useProgram(this.prog),t.viewport(0,0,this.canvas.width,this.canvas.height);let a=this.scaleVec();t.uniform1f(this.uni.uTime,o),t.uniform1f(this.uni.uAspect,this.aspect),t.uniform2f(this.uni.uScale,a[0],a[1]),t.uniform2f(this.uni.uShift,this.opts.shift[0],this.opts.shift[1]),t.uniform3f(this.uni.uPointer,this.pointer.x,this.pointer.y,this.pointer.active),this.uni.uWind&&t.uniform1f(this.uni.uWind,this.wind),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.sdfTex),t.uniform1i(this.uni.uSDF,0),this.opts.sim&&(t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.simTex[this.simSrc]),t.uniform1i(this.uni.uState,1),t.uniform2f(this.uni.uSimTexel,1/c,1/c)),t.drawArrays(t.TRIANGLES,0,3);let i=this.opts.particles;i&&(t.useProgram(this.partProg),t.uniform1f(this.partUni.uTime,o),t.uniform2f(this.partUni.uScale,a[0],a[1]),t.uniform2f(this.partUni.uShift,this.opts.shift[0],this.opts.shift[1]),t.uniform1f(this.partUni.uDpr,T),t.uniform1f(this.partUni.uWind,this.wind),t.uniform4f(this.partUni.uCfgA,i.travel,i.lifeMin,i.lifeMax,i.alongNormal),t.uniform4f(this.partUni.uCfgB,i.wiggle,i.sizeMin,i.sizeMax,i.sparse),t.uniform3f(this.partUni.uColA,i.colA[0],i.colA[1],i.colA[2]),t.uniform3f(this.partUni.uColB,i.colB[0],i.colB[1],i.colB[2]),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE),t.bindVertexArray(this.partVao),t.drawArrays(t.POINTS,0,i.count),t.bindVertexArray(null),t.disable(t.BLEND))}};var C=`#version 300 es
${h}
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
}`,m=matchMedia("(prefers-reduced-motion: reduce)"),d=new Set,p=0,b=0,f=0;function _(r){if(p=0,document.hidden||m.matches){f=0;return}f&&(b+=Math.min((r-f)/1e3,.05)),f=r;for(let o of d)o.visible&&o.ready&&o.draw(b);[...d].some(o=>o.visible&&o.ready)?p=requestAnimationFrame(_):f=0}function A(){!p&&!document.hidden&&!m.matches&&(p=requestAnimationFrame(_))}var E=class extends v{visible=!1;ready=!1;photo;photoAspect=1;constructor(o,t){let a=[];for(let e=0;e<160;e++)a.push(Math.random(),Math.random(),0,1);if(super(o,C,{sdf:new Uint8Array(512*512).fill(255),edges:a},{sim:!0,zoom:1,shift:[0,0],particles:{count:160,travel:.1,lifeMin:4,lifeMax:8,alongNormal:.15,wiggle:.02,sizeMin:1.5,sizeMax:3.5,sparse:.5,colA:[.1,.24,.3],colB:[.22,.4,.48]}}),!this.ok)return;let i=this.gl;this.photo=i.createTexture(),i.activeTexture(i.TEXTURE2),i.bindTexture(i.TEXTURE_2D,this.photo),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,t),this.photoAspect=t.naturalWidth/t.naturalHeight,this.ready=!0,this.canvas.addEventListener("webglcontextlost",e=>{e.preventDefault(),this.ready=!1,o.classList.remove("water-ready")}),d.add(this),new IntersectionObserver(([e])=>{this.visible=e.isIntersecting,A()}).observe(o),m.matches||(this.draw(0),o.classList.add("water-ready"))}draw(o){if(!this.ready)return;let t=this.gl;t.useProgram(this.prog),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.photo),t.uniform1i(t.getUniformLocation(this.prog,"uPhoto"),2),t.uniform1f(t.getUniformLocation(this.prog,"uPhotoAspect"),this.photoAspect),super.draw(o)}};document.querySelectorAll(".category-card > img").forEach(r=>{let o=document.createElement("span");o.className="flower-photo",r.before(o),o.append(r);let t=document.createElement("canvas");t.setAttribute("aria-hidden","true");let a=document.createElement("span");a.className="fail",a.hidden=!0,o.append(t,a);let i=()=>{if(r.naturalWidth)try{new E(o,r)}catch(e){o.classList.remove("water-ready"),console.warn("Water photo fallback:",e)}};r.complete?i():r.addEventListener("load",i,{once:!0})});document.addEventListener("visibilitychange",A);m.addEventListener("change",()=>{for(let r of d)r.el.classList.toggle("water-ready",!m.matches&&r.ready);A()});})();

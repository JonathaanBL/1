// Motion layer for the sample sites: a WebGL liquid background in the hero,
// a spinning review stamp, a big scrolling text band, reveal-on-scroll and a
// 3D tilt on review cards. Everything degrades to the static page when WebGL
// or JavaScript is missing, and stays still under prefers-reduced-motion.

const rgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).join(",");
};

export const cssEfectos = `
main { overflow-x: clip; }
.hero { position: relative; overflow: hidden; isolation: isolate; }
.lienzo { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; display: block; }
.grano { position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .07; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.sello { position: absolute; right: max(16px, calc((100% - 1080px) / 2)); bottom: 32px; width: clamp(104px, 16vw, 150px); aspect-ratio: 1; z-index: 1; }
.sello svg { width: 100%; height: 100%; animation: girar 18s linear infinite; }
.sello text { font: 600 10.5px var(--texto); letter-spacing: 2.2px; text-transform: uppercase; fill: currentColor; }
.sello .centro { position: absolute; inset: 0; display: grid; place-items: center; font: 400 30px var(--titulo); color: var(--acento); }
@media (max-width: 640px) { .sello { top: 18px; bottom: auto; right: 16px; width: 92px; } .sello text { font-size: 11.5px; } }
.banda { background: var(--acento); color: var(--sobre-acento); overflow: hidden; rotate: -2deg; margin: -18px -2% 0; padding-block: 14px; position: relative; z-index: 2; }
.banda-pista { display: flex; gap: 40px; width: max-content; animation: banda 26s linear infinite; }
@keyframes banda { to { translate: calc(-50% - 20px) 0; } }
.banda span { font: 400 clamp(32px, 6vw, 64px)/1 var(--titulo); text-transform: uppercase; white-space: nowrap; display: flex; align-items: center; gap: 40px; }
.banda span::after { content: "✦"; font-size: .5em; }
.banda .hueco { color: transparent; -webkit-text-stroke: 1.5px var(--sobre-acento); }
html.js .revela { opacity: 0; translate: 0 32px; transition: opacity .8s ease, translate .8s cubic-bezier(.2, .7, .2, 1); }
html.js .revela.visto { opacity: 1; translate: 0 0; }
.resena { transition: transform .25s ease; transform-style: preserve-3d; }
@media (prefers-reduced-motion: reduce) {
  .sello svg, .banda-pista { animation: none; }
  html.js .revela { opacity: 1; translate: none; transition: none; }
}
`;

// The hero shader: domain-warped noise in the theme's colours that drifts
// slowly and leans toward the pointer.
export function scriptEfectos(t) {
  return `<script>
document.documentElement.classList.add("js");
(() => {
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const vistos = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); vistos.unobserve(e.target); }
  }), { threshold: .12 });
  document.querySelectorAll(".revela").forEach((el) => vistos.observe(el));

  if (!quieto && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".resena").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = "perspective(700px) rotateY(" + x * 14 + "deg) rotateX(" + -y * 14 + "deg) translateZ(8px)";
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  const lienzo = document.querySelector(".lienzo");
  const gl = lienzo && lienzo.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) { lienzo && lienzo.remove(); return; }
  const fuente = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, fuente(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"));
  gl.attachShader(prog, fuente(gl.FRAGMENT_SHADER, \`precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m;
const vec3 c1=vec3(${rgb(t.fondo)}), c2=vec3(${rgb(t.acento)});
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+17.;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=uv*vec2(r.x/r.y,1.)*1.6;
  vec2 q=vec2(fbm(p+t*.04),fbm(p+vec2(5.2,1.3)-t*.03));
  float v=fbm(p+2.2*q+m*.6);
  vec3 c3=mix(c2,vec3(1.),.45);
  vec3 col=mix(c1,c2,smoothstep(.42,.82,v));
  col=mix(col,c3,smoothstep(.72,.95,v)*.55);
  col=mix(col,c1,smoothstep(.75,0.,uv.x)*.55);
  gl_FragColor=vec4(col,1.);
}\`));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { lienzo.remove(); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");
  const meta = { x: 0, y: 0 }, raton = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { meta.x = e.clientX / innerWidth - .5; meta.y = .5 - e.clientY / innerHeight; }, { passive: true });
  const medir = () => {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    lienzo.width = lienzo.clientWidth * d; lienzo.height = lienzo.clientHeight * d;
    gl.viewport(0, 0, lienzo.width, lienzo.height); gl.uniform2f(uR, lienzo.width, lienzo.height);
  };
  medir(); addEventListener("resize", medir);
  let visible = true, inicio = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !quieto) requestAnimationFrame(cuadro); }).observe(lienzo);
  function cuadro(ahora) {
    raton.x += (meta.x - raton.x) * .04; raton.y += (meta.y - raton.y) * .04;
    gl.uniform1f(uT, quieto ? 12 : (ahora - inicio) / 1000);
    gl.uniform2f(uM, raton.x, raton.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !quieto) requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);
})();
</script>`;
}

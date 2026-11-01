// A spinning 3D object for the hero, one per kind of business, plus a custom
// cursor. The object is a stack of flat silhouettes pushed apart in Z with CSS
// 3D transforms, so it looks solid without loading a 3D library.

// 24×24 silhouettes. `evenodd` lets rings (the scissor handles) have holes.
const FORMAS = {
  restaurante: "M7 2h10l-.6 6.2A4.4 4.4 0 0 1 13 12.2V19h3.5v2h-9v-2H11v-6.8A4.4 4.4 0 0 1 7.6 8.2Z",
  barberia:
    "M6 2.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Zm0 1.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z" +
    "M6 14.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Zm0 1.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z" +
    "M8.4 8.1 21.4 18l-1.3 1.6L7.3 9.6Z M8.4 15.9 21.4 6l-1.3-1.6L7.3 14.4Z",
  belleza: "M10 1.5h4v6.5h-4Z M7.5 9h9a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 16.5 22h-9A2.5 2.5 0 0 1 5 19.5v-8A2.5 2.5 0 0 1 7.5 9Z",
  taller: "M21.2 6.6a5.2 5.2 0 0 1-6.9 5L6.4 19.5a2.1 2.1 0 0 1-3-3l7.9-7.9a5.2 5.2 0 0 1 6.6-6.3l-3.3 3.3.6 2.7 2.7.6Z",
  salud: "M9 2.5h6V9h6.5v6H15v6.5H9V15H2.5V9H9Z",
  gimnasio: "M1.5 9.5h2.2V7h3.6v10H3.7v-2.5H1.5Z M16.7 7h3.6v2.5h2.2v5h-2.2V17h-3.6Z M7.3 10.8h9.4v2.4H7.3Z",
  general: "M12 1.8l3 6.6 7.2.8-5.4 4.8 1.5 7.1L12 17.5 5.7 21.1l1.5-7.1L1.8 9.2 9 8.4Z",
};

const CAPAS = 14;

export function objeto3d(tema) {
  const d = FORMAS[tema] ?? FORMAS.general;
  const capas = Array.from({ length: CAPAS }, (_, i) => {
    // Front and back faces carry the accent; the layers between are darker,
    // which reads as the object's side.
    const cara = i === 0 || i === CAPAS - 1;
    const tono = cara ? "var(--acento)" : `color-mix(in srgb, var(--acento) ${55 - Math.abs(i - CAPAS / 2) * 2}%, #000)`;
    return `<svg viewBox="0 0 24 24" style="--z:${i - (CAPAS - 1) / 2};color:${tono}"${i === CAPAS - 1 ? ' class="frente"' : ""}><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>`;
  }).join("");
  return `<div class="objeto" aria-hidden="true"><div class="inclina"><div class="giro">${capas}</div></div><div class="sombra"></div></div>`;
}

export const cssObjeto = `
.hero .envoltura { position: relative; z-index: 1; }
.objeto { position: absolute; z-index: 0; top: 50%; right: max(24px, calc((100% - 1080px) / 2 + 40px)); width: clamp(150px, 26vw, 320px); aspect-ratio: 1; translate: 0 -55%; perspective: 900px; --paso: clamp(1.2px, .2vw, 2.4px); }
.inclina, .giro { position: absolute; inset: 0; transform-style: preserve-3d; }
.inclina { transition: transform .4s ease-out; }
.giro { animation: girar3d 9s linear infinite; }
.giro svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: translateZ(calc(var(--z) * var(--paso))); }
.giro .frente { filter: drop-shadow(0 0 18px color-mix(in srgb, var(--acento) 60%, transparent)) brightness(1.12); }
.sombra { position: absolute; left: 15%; right: 15%; bottom: -14%; height: 12%; border-radius: 50%; background: radial-gradient(closest-side, rgb(0 0 0 / .45), transparent); animation: sombra 9s linear infinite; }
@keyframes girar3d { from { transform: rotateX(-14deg) rotateY(0); } to { transform: rotateX(-14deg) rotateY(360deg); } }
@keyframes sombra { 0%, 50%, 100% { scale: 1 1; } 25%, 75% { scale: .55 1; } }
@media (max-width: 640px) {
  .hero:has(.objeto) { padding-bottom: 190px; }
  .objeto { top: auto; bottom: 34px; right: 50%; translate: 50% 0; width: 128px; --paso: 1.1px; }
}
.cursor { position: fixed; left: 0; top: 0; z-index: 50; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; pointer-events: none;
  border: 1.5px solid var(--acento); background: color-mix(in srgb, var(--acento) 12%, transparent); transition: width .25s, height .25s, margin .25s, background .25s, opacity .25s; opacity: 0; }
.cursor.activo { opacity: 1; }
.cursor.sobre { width: 64px; height: 64px; margin: -32px 0 0 -32px; background: color-mix(in srgb, var(--acento) 25%, transparent); }
@media (prefers-reduced-motion: reduce) {
  .giro { animation: none; transform: rotateX(-14deg) rotateY(-28deg); }
  .sombra { animation: none; }
  .cursor { display: none; }
}
`;

// Pointer-driven tilt for the object and the trailing cursor ring (mouse only).
export const scriptObjeto = `
  if (!quieto && matchMedia("(pointer: fine)").matches) {
    const inclina = document.querySelector(".inclina");
    const anillo = document.createElement("div");
    anillo.className = "cursor"; document.body.append(anillo);
    let cx = innerWidth / 2, cy = innerHeight / 2, ax = cx, ay = cy;
    addEventListener("pointermove", (e) => {
      cx = e.clientX; cy = e.clientY; anillo.classList.add("activo");
      anillo.classList.toggle("sobre", !!e.target.closest("a, button"));
      if (inclina) inclina.style.transform = "rotateX(" + ((cy / innerHeight) - .5) * -30 + "deg) rotateY(" + ((cx / innerWidth) - .5) * 40 + "deg)";
    }, { passive: true });
    document.addEventListener("pointerleave", () => anillo.classList.remove("activo"));
    (function seguir() {
      ax += (cx - ax) * .18; ay += (cy - ay) * .18;
      anillo.style.transform = "translate(" + ax + "px," + ay + "px)";
      requestAnimationFrame(seguir);
    })();
  }
`;

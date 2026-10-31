import { TEMAS, temaPara } from "./temas.mjs";
import { TEXTOS } from "./textos.mjs";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const soloDigitos = (s = "") => String(s).replace(/\D/g, "");

// Builds the whole page for one business. `n` is the business file, `autor`
// the seller's details from config.json.
export function pagina(n, autor) {
  const t = TEMAS[temaPara(n.tipo)];
  const tx = TEXTOS[n.idioma === "en" ? "en" : "es"];
  const lista = n.servicios ?? [];
  const tituloLista = temaPara(n.tipo) === "restaurante" ? tx.menu : tx.servicios;
  const fotos = n.fotos ?? [];
  const tel = soloDigitos(n.telefono);
  const wa = soloDigitos(n.whatsapp || n.telefono);
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(tx.hola(n.nombre))}` : "";
  const reservar = n.reservas_url || waLink || (tel ? `tel:+${tel}` : "");
  const mapa = n.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${n.nombre}, ${n.direccion}`)}`
    : "";
  const autorWa = soloDigitos(autor.whatsapp);
  const contactoAutor = autorWa
    ? `https://wa.me/${autorWa}?text=${encodeURIComponent(`Hola, vi la web de muestra de ${n.nombre}`)}`
    : autor.enlace || "";

  const heroFondo = fotos[0]
    ? `linear-gradient(180deg, rgb(0 0 0 / .25), rgb(0 0 0 / .65)), url("${esc(fotos[0])}") center / cover`
    : t.degradado;
  const heroTinta = fotos[0] ? "#ffffff" : t.tinta;

  return `<!doctype html>
<html lang="${n.idioma === "en" ? "en" : "es"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(n.nombre)}${n.ciudad ? ` · ${esc(n.ciudad)}` : ""}</title>
<meta name="description" content="${esc(n.descripcion || n.eslogan || n.nombre)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${t.fuentes}&display=swap">
<style>
:root {
  --fondo: ${t.fondo}; --superficie: ${t.superficie}; --tinta: ${t.tinta}; --suave: ${t.suave};
  --acento: ${t.acento}; --sobre-acento: ${t.sobreAcento};
  --titulo: ${t.titulo}; --texto: ${t.texto};
  color-scheme: ${["belleza", "salud", "general"].includes(temaPara(n.tipo)) ? "light" : "dark"};
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body { margin: 0; background: var(--fondo); color: var(--tinta); font: 16px/1.6 var(--texto); padding-bottom: 72px; }
a { color: inherit; }
img { max-width: 100%; display: block; }
.envoltura { width: min(1080px, 100% - 32px); margin-inline: auto; }
.aviso { background: var(--acento); color: var(--sobre-acento); font-size: 13px; text-align: center; padding: 6px 16px; }
header { position: sticky; top: 0; z-index: 5; background: color-mix(in srgb, var(--fondo) 88%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid color-mix(in srgb, var(--tinta) 10%, transparent); }
header .envoltura { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 60px; }
.marca { font-family: var(--titulo); font-size: 22px; text-decoration: none; ${t.mayusculas ? "text-transform: uppercase; letter-spacing: .04em;" : ""} }
nav { display: flex; gap: 20px; font-size: 14px; }
nav a { text-decoration: none; color: var(--suave); }
nav a:hover { color: var(--tinta); }
@media (max-width: 640px) { nav { display: none; } }
.hero { background: ${heroFondo}; color: ${heroTinta}; padding-block: clamp(72px, 14vw, 140px); }
.hero h1 { font-family: var(--titulo); font-size: clamp(40px, 8vw, 84px); line-height: 1; margin: 0 0 16px; max-width: 14ch; text-wrap: balance; ${t.mayusculas ? "text-transform: uppercase;" : ""} }
.hero p { font-size: clamp(17px, 2.2vw, 20px); max-width: 52ch; margin: 0 0 28px; opacity: .9; }
.estrellas { display: inline-flex; gap: 8px; align-items: center; font-size: 14px; margin-bottom: 20px; padding: 6px 12px; border-radius: 999px; background: rgb(0 0 0 / .25); color: #fff; }
.botones { display: flex; flex-wrap: wrap; gap: 12px; }
.boton { display: inline-flex; align-items: center; gap: 8px; padding: 13px 22px; border-radius: 999px; font-weight: 600; text-decoration: none; border: 1.5px solid currentColor; }
.boton.principal { background: var(--acento); color: var(--sobre-acento); border-color: var(--acento); }
.boton:focus-visible, nav a:focus-visible, .marca:focus-visible { outline: 2px solid var(--acento); outline-offset: 3px; }
section { padding-block: clamp(56px, 9vw, 96px); }
h2 { font-family: var(--titulo); font-size: clamp(30px, 5vw, 44px); margin: 0 0 28px; ${t.mayusculas ? "text-transform: uppercase; letter-spacing: .02em;" : ""} }
.lista { display: grid; gap: 4px; }
.item { display: grid; grid-template-columns: 1fr auto; gap: 4px 24px; padding: 16px 0; border-bottom: 1px solid color-mix(in srgb, var(--tinta) 12%, transparent); }
.item h3 { margin: 0; font-size: 18px; }
.item .precio { font-weight: 600; color: var(--acento); font-variant-numeric: tabular-nums; }
.item p { grid-column: 1 / -1; margin: 0; color: var(--suave); font-size: 15px; }
.galeria { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.galeria img { aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; width: 100%; }
.alterna { background: var(--superficie); }
.datos { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 40px; }
.horario { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.horario td { padding: 8px 0; border-bottom: 1px solid color-mix(in srgb, var(--tinta) 10%, transparent); }
.horario td:last-child { text-align: right; color: var(--suave); }
.contacto p { margin: 0 0 8px; }
footer { padding-block: 32px; font-size: 14px; color: var(--suave); border-top: 1px solid color-mix(in srgb, var(--tinta) 10%, transparent); }
footer .envoltura { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }
.barra { position: fixed; inset: auto 0 0 0; z-index: 6; display: flex; gap: 8px; padding: 10px max(16px, env(safe-area-inset-left)) calc(10px + env(safe-area-inset-bottom)); background: var(--fondo); border-top: 1px solid color-mix(in srgb, var(--tinta) 12%, transparent); }
.barra .boton { flex: 1; justify-content: center; padding: 11px 12px; }
@media (min-width: 900px) { .barra { display: none; } body { padding-bottom: 0; } }
</style>
</head>
<body>
<div class="aviso">${esc(tx.muestra(n.nombre))}</div>
<header>
  <div class="envoltura">
    <a class="marca" href="#inicio">${esc(n.nombre)}</a>
    <nav>
      ${lista.length ? `<a href="#lista">${tituloLista}</a>` : ""}
      ${fotos.length > 1 ? `<a href="#galeria">${tx.galeria}</a>` : ""}
      <a href="#visitanos">${tx.visitanos}</a>
    </nav>
  </div>
</header>
<main>
<div class="hero" id="inicio">
  <div class="envoltura">
    ${n.rating ? `<div class="estrellas">★ ${esc(n.rating)}${n.resenas ? ` · ${esc(tx.resenas(n.resenas))}` : ""}</div>` : ""}
    <h1>${esc(n.eslogan || n.nombre)}</h1>
    ${n.descripcion ? `<p>${esc(n.descripcion)}</p>` : ""}
    <div class="botones">
      ${reservar ? `<a class="boton principal" href="${esc(reservar)}">${tx.reservar}</a>` : ""}
      ${tel ? `<a class="boton" href="tel:+${tel}">${tx.llamar}</a>` : ""}
      ${mapa ? `<a class="boton" href="${esc(mapa)}" target="_blank" rel="noopener">${tx.comoLlegar}</a>` : ""}
    </div>
  </div>
</div>
${lista.length ? `<section id="lista">
  <div class="envoltura">
    <h2>${tituloLista}</h2>
    <div class="lista">
      ${lista.map((s) => `<div class="item"><h3>${esc(s.nombre)}</h3><span class="precio">${esc(s.precio ?? "")}</span>${s.descripcion ? `<p>${esc(s.descripcion)}</p>` : ""}</div>`).join("\n      ")}
    </div>
  </div>
</section>` : ""}
${fotos.length > 1 ? `<section id="galeria" class="alterna">
  <div class="envoltura">
    <h2>${tx.galeria}</h2>
    <div class="galeria">
      ${fotos.slice(1).map((f) => `<img src="${esc(f)}" alt="${esc(n.nombre)}" loading="lazy">`).join("\n      ")}
    </div>
  </div>
</section>` : ""}
<section id="visitanos" class="${fotos.length > 1 ? "" : "alterna"}">
  <div class="envoltura datos">
    <div class="contacto">
      <h2>${tx.visitanos}</h2>
      ${n.direccion ? `<p>${esc(n.direccion)}</p>` : ""}
      ${n.telefono ? `<p><a href="tel:+${tel}">${esc(n.telefono)}</a></p>` : ""}
      ${n.email ? `<p><a href="mailto:${esc(n.email)}">${esc(n.email)}</a></p>` : ""}
      ${mapa ? `<p><a href="${esc(mapa)}" target="_blank" rel="noopener">${tx.comoLlegar} →</a></p>` : ""}
    </div>
    ${n.horario?.length ? `<div>
      <h2>${tx.horario}</h2>
      <table class="horario">
        ${n.horario.map(([d, h]) => `<tr><td>${esc(d)}</td><td>${esc(h)}</td></tr>`).join("\n        ")}
      </table>
    </div>` : ""}
  </div>
</section>
</main>
<footer>
  <div class="envoltura">
    <span>© ${new Date().getFullYear()} ${esc(n.nombre)}</span>
    <span>${esc(tx.hechaPor(autor.nombre))}${contactoAutor ? ` · <a href="${esc(contactoAutor)}" target="_blank" rel="noopener">${tx.escribeme}</a>` : ""}</span>
  </div>
</footer>
<div class="barra">
  ${tel ? `<a class="boton" href="tel:+${tel}">${tx.llamar}</a>` : ""}
  ${waLink ? `<a class="boton principal" href="${esc(waLink)}">${tx.whatsapp}</a>` : reservar ? `<a class="boton principal" href="${esc(reservar)}">${tx.reservar}</a>` : ""}
</div>
</body>
</html>
`;
}

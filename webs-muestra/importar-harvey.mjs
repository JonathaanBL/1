// Turns the businesses Harvey found with no website into draft business files.
// Usage: node importar-harvey.mjs <ruta/a/harvey/data/harvey.db> [--ciudad Queens] [--limite 20] [--todos]
//   --todos also imports businesses that do have a website (to offer a redesign).
// Existing files in negocios/ are never overwritten, so edits survive a re-import.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const args = process.argv.slice(2);
const ruta = args.find((a) => !a.startsWith("--"));
const opcion = (nombre) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!ruta || !existsSync(ruta)) {
  console.error("Uso: node importar-harvey.mjs <ruta/a/harvey.db> [--ciudad X] [--limite N] [--todos]");
  process.exit(1);
}
const ciudad = opcion("ciudad") ?? "";
const limite = Number(opcion("limite") ?? 20);
const todos = args.includes("--todos");

const db = new DatabaseSync(ruta, { readOnly: true });
const ultimo = (codigo) => `(SELECT value_num FROM observations o WHERE o.company_id = c.id
  AND o.signal_code = '${codigo}' ORDER BY observed_at DESC LIMIT 1)`;
const filas = db.prepare(`
  SELECT c.id, c.name, c.domain, c.industry, c.location, c.phone, c.description,
         ${ultimo("REVIEW_RATING")} AS rating, ${ultimo("REVIEW_COUNT")} AS resenas,
         ${ultimo("NO_WEBSITE")} AS sin_web
  FROM companies c
  WHERE c.name != '' AND c.location LIKE ?
    ${todos ? "" : "AND (c.domain = '' OR " + ultimo("NO_WEBSITE") + " = 1)"}
  ORDER BY resenas DESC NULLS LAST
  LIMIT ?`).all(`%${ciudad}%`, limite);

const slugDe = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

let nuevos = 0;
for (const f of filas) {
  const archivo = join(new URL(".", import.meta.url).pathname, "negocios", `${slugDe(f.name)}.json`);
  if (existsSync(archivo)) continue;
  const chile = /chile|santiago|valpara|concepci|vi[ñn]a/i.test(f.location);
  writeFileSync(archivo, JSON.stringify({
    nombre: f.name,
    tipo: f.industry || "general",
    idioma: chile ? "es" : "en",
    ciudad: f.location,
    direccion: f.location,
    telefono: f.phone,
    whatsapp: "",
    rating: f.rating ?? undefined,
    resenas: f.resenas ?? undefined,
    eslogan: "",
    descripcion: f.description || "",
    servicios: [],
    horario: [],
    fotos: [],
    reservas_url: "",
    _harvey: { id: f.id, web_actual: f.domain || null },
  }, null, 2) + "\n");
  nuevos++;
  console.log(`+ ${f.name} (${f.location})${f.domain ? ` · tiene web: ${f.domain}` : " · sin web"}`);
}
console.log(`${nuevos} borradores nuevos de ${filas.length} encontrados. Complétalos en negocios/ y ejecuta: node generar.mjs`);

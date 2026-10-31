// Builds one sample site per business file in negocios/ into sitios/<slug>/.
// Usage: node generar.mjs            (all businesses)
//        node generar.mjs mi-local   (only negocios/mi-local.json)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pagina } from "./plantilla/pagina.mjs";

const raiz = new URL(".", import.meta.url).pathname;
const autor = JSON.parse(readFileSync(join(raiz, "config.json"), "utf8"));
const soloEste = process.argv[2];

const archivos = readdirSync(join(raiz, "negocios"))
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !soloEste || f === `${soloEste}.json`);

if (!archivos.length) {
  console.error(soloEste ? `No existe negocios/${soloEste}.json` : "No hay negocios en negocios/");
  process.exit(1);
}

for (const archivo of archivos) {
  const slug = archivo.replace(/\.json$/, "");
  const negocio = JSON.parse(readFileSync(join(raiz, "negocios", archivo), "utf8"));
  if (!negocio.nombre) {
    console.error(`negocios/${archivo}: falta "nombre", lo salto`);
    continue;
  }
  const destino = join(raiz, "sitios", slug);
  mkdirSync(destino, { recursive: true });
  writeFileSync(join(destino, "index.html"), pagina(negocio, autor));
  console.log(`✓ ${negocio.nombre} → sitios/${slug}/index.html  (${autor.enlace}m/${slug}/)`);
}

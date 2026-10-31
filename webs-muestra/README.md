# Webs de muestra

Crea una web de una página para un local (restaurante, barbería, taller…) a partir de un archivo con sus datos, para enseñársela antes de vendérsela.

Cada web se publica sola en `https://jonathaanbl.github.io/1/m/<nombre-del-archivo>/` al subir los cambios a GitHub. Lleva una franja arriba que dice que es una muestra, y no aparece en Google (`noindex`).

## Cómo hacer una

1. Copia `negocios/ejemplo-parrilla.json` con el nombre del local, por ejemplo `negocios/la-esquina.json`.
2. Rellena sus datos. Lo único obligatorio es `nombre`:

   | Campo | Qué es |
   |---|---|
   | `tipo` | restaurante, barberia, belleza, taller, salud, gimnasio o general. También entiende categorías de Google como "Hair salon" o "Auto repair". Elige colores y letras. |
   | `idioma` | `es` o `en` |
   | `eslogan`, `descripcion` | El titular grande y el texto de debajo |
   | `telefono`, `whatsapp` | Con prefijo de país (`+56…`, `+1…`). Si no hay WhatsApp, usa el teléfono. |
   | `direccion` | Sale el botón "Cómo llegar" a Google Maps |
   | `rating`, `resenas` | Estrellas y número de reseñas de Google |
   | `servicios` | Lista de `{ "nombre", "precio", "descripcion" }`. En restaurantes se titula "Menú". |
   | `horario` | Lista de `["Lunes a viernes", "9:00 – 20:00"]` |
   | `fotos` | Enlaces a fotos. La primera va de fondo arriba, el resto en galería. Usa fotos que el local te haya dado o permitido usar. |
   | `reservas_url` | Enlace de reservas (Booksy, OpenTable, Calendly…). Si no hay, "Reservar" abre WhatsApp. |

3. Genera la web y mírala en el navegador: `node generar.mjs la-esquina`, y abre `sitios/la-esquina/index.html`.
4. Súbela a GitHub. En uno o dos minutos está en `https://jonathaanbl.github.io/1/m/la-esquina/`.

Tus datos (nombre y WhatsApp para el botón "¿Te gusta? Escríbeme") están en `config.json`.

## Desde Harvey

Para crear borradores con los locales sin web que encontró Harvey:

```bash
node importar-harvey.mjs ruta/a/harvey/data/harvey.db --ciudad Queens --limite 20
```

Crea un archivo por local en `negocios/` con nombre, teléfono, dirección, estrellas y tipo, ordenados por número de reseñas. Añade `--todos` para incluir también los que ya tienen web (para ofrecerles renovarla). Nunca sobrescribe un archivo que ya existe. Después completa eslogan, servicios, horario y fotos, y genera las webs.

Necesita Node.js 22.5 o más nuevo.

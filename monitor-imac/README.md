# Monitor de temperatura del iMac

Panel estilo JARVIS que muestra en vivo la temperatura del procesador y de la gráfica, la velocidad de los ventiladores, la carga y cuánto tiempo lleva encendido, con un gráfico de los últimos 30 minutos. Pensado para el iMac 2011 con Sequoia (OCLP), que va a estar encendido todo el día.

Los datos vienen de `powermetrics`, la herramienta de Apple que ya trae macOS. No hace falta instalar nada más. El panel solo se puede abrir desde el propio iMac (`localhost`).

## Abrirlo

1. Descarga esta carpeta en el iMac. En GitHub: **Code → Download ZIP**, y descomprímelo.
2. Haz doble clic en **`iniciar.command`**.
   - Si macOS lo bloquea: clic derecho → **Abrir** → **Abrir**.
   - Si dice que no tiene permiso, abre Terminal en esta carpeta y ejecuta `chmod +x iniciar.command`.
3. Escribe la contraseña de tu Mac cuando la pida en la ventana de Terminal. No se ve mientras la escribes; es normal.
4. Se abre el panel en `http://localhost:8787`. Deja la ventana de Terminal abierta: si la cierras, el monitor se detiene.

La primera vez, si macOS dice que necesita las "herramientas de línea de comandos" para `python3`, acepta la instalación (unos minutos) y vuelve a abrir `iniciar.command`.

Sin el doble clic, desde Terminal en esta carpeta:

```bash
sudo python3 monitor.py
```

Para ver el panel con datos inventados, sin contraseña: `python3 monitor.py --demo`.

## Cómo leerlo

| Color | Procesador | Gráfica |
|---|---|---|
| Azul · Normal | menos de 70 °C | menos de 75 °C |
| Naranja · Tibio | 70–84 °C | 75–89 °C |
| Rojo · Caliente | 85 °C o más | 90 °C o más |

Los anillos giran más rápido cuanto más caliente está el procesador. En rojo, el reactor late y aparece un aviso. Los límites están al principio del `<script>` de `panel/index.html` (`UMBRAL`), por si quieres ajustarlos.

Un iMac de 2011 tranquilo suele estar entre 40 y 60 °C. Si pasa mucho tiempo en rojo sin estar haciendo nada pesado, suele ser polvo en los ventiladores o la pasta térmica seca, algo habitual a esa edad.

## Si no muestra datos

El panel dice arriba qué pasa:

- **"powermetrics necesita permisos de administrador"**: ábrelo con `sudo` o con `iniciar.command`.
- **"powermetrics no devolvió sensores en este Mac"**: con OCLP, algunos modelos no exponen todos los sensores. Pásame lo que muestra `sudo powermetrics --samplers smc -n 1` y lo adapto.

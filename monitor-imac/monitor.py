#!/usr/bin/env python3
"""Temperature monitor for an Intel iMac: reads the SMC sensors and serves a
live dashboard at http://localhost:8787.

Sensors come from sensores/smc.c, compiled on first run with the Command Line
Tools' clang, which reads the SMC directly and works on older Macs patched with
OCLP. If that is unavailable it falls back to Apple's powermetrics (needs root).

    sudo python3 monitor.py           # real sensors
    python3 monitor.py --demo         # simulated readings, to try the panel

Works with the Python 3.9 that ships with Apple's Command Line Tools.
"""
import argparse
import json
import math
import os
import random
import re
import subprocess
import threading
import time
from collections import deque
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
PUERTO = 8787
INTERVALO_MS = 2000
HISTORIAL = 900  # 30 minutes at one reading every 2 seconds

TEMPERATURA = re.compile(r"^(.+?) (?:die )?temperature:\s*([\d.]+)\s*C", re.I | re.M)
VENTILADOR = re.compile(r"^(Fan[^:]*):\s*([\d.]+)\s*rpm", re.I | re.M)
LECTOR_C = CARPETA / "sensores" / "smc.c"
LECTOR = CARPETA / "sensores" / "smc-lector"

# SMC keys by preference: die first, then proximity, then heatsink.
CLAVES_CPU = ("TC0D", "TC0E", "TC0F", "TC0P", "TC0H")
CLAVES_GPU = ("TG0D", "TG0P", "TG0H")
NOMBRES = {"TH0P": "Disco", "TH1P": "Disco 2", "Tm0P": "Memoria", "TA0P": "Ambiente",
           "TL0P": "Pantalla", "TW0P": "Wi-Fi", "TO0P": "Lector óptico"}
NIVEL = re.compile(r"^(CPU|GPU|IO) Thermal level:\s*(\d+)", re.I | re.M)

estado = {"actual": None, "historial": deque(maxlen=HISTORIAL), "error": None, "demo": False}
candado = threading.Lock()


def interpretar(texto):
    """Pulls temperatures, fan speeds and thermal levels out of one
    `powermetrics --samplers smc` sample."""
    temps = {nombre.strip(): float(valor) for nombre, valor in TEMPERATURA.findall(texto)}
    ventiladores = [float(rpm) for _, rpm in VENTILADOR.findall(texto)]
    niveles = {nombre.upper(): int(valor) for nombre, valor in NIVEL.findall(texto)}
    return {
        "cpu": temps.get("CPU"),
        "gpu": temps.get("GPU"),
        "otras": {k: v for k, v in temps.items() if k not in ("CPU", "GPU")},
        "ventiladores": ventiladores,
        "nivelTermico": niveles,
    }


def preparar_lector():
    """Compiles the SMC reader once. Returns an error message, or None."""
    if LECTOR.exists() and LECTOR.stat().st_mtime >= LECTOR_C.stat().st_mtime:
        return None
    try:
        r = subprocess.run(["clang", "-O2", "-framework", "IOKit", "-o", str(LECTOR), str(LECTOR_C)],
                           capture_output=True, text=True, timeout=120)
    except OSError:
        return "falta clang (instala las herramientas de línea de comandos: xcode-select --install)"
    return None if r.returncode == 0 else "no se pudo compilar el lector SMC: " + r.stderr.strip()[-300:]


def interpretar_smc(texto):
    """Turns the reader's "KEY value" lines into a reading."""
    v = {}
    for linea in texto.splitlines():
        partes = linea.split()
        if len(partes) == 2:
            try:
                v[partes[0]] = float(partes[1])
            except ValueError:
                pass
    primera = lambda claves: next((v[c] for c in claves if c in v), None)
    return {
        "cpu": primera(CLAVES_CPU),
        "gpu": primera(CLAVES_GPU),
        "otras": {NOMBRES[c]: v[c] for c in NOMBRES if c in v},
        "ventiladores": [v[f"F{i}Ac"] for i in range(int(v.get("FNum", 0))) if f"F{i}Ac" in v],
        "nivelTermico": {},
        "fuente": "SMC",
    }


def leer_smc():
    salida = subprocess.run([str(LECTOR)], capture_output=True, text=True, timeout=10)
    if salida.returncode != 0:
        raise RuntimeError(salida.stderr.strip() or "el lector SMC falló")
    lectura = interpretar_smc(salida.stdout)
    if lectura["cpu"] is None and not lectura["ventiladores"]:
        raise RuntimeError("el SMC no devolvió sensores")
    time.sleep(INTERVALO_MS / 1000)
    return lectura


def leer_powermetrics():
    if os.geteuid() != 0:
        raise RuntimeError("powermetrics necesita permisos de administrador: ejecuta  sudo python3 monitor.py")
    salida = subprocess.run(
        ["powermetrics", "--samplers", "smc", "-i", str(INTERVALO_MS), "-n", "1"],
        capture_output=True, text=True, timeout=30,
    )
    if salida.returncode != 0:
        raise RuntimeError(salida.stderr.strip() or "powermetrics no respondió")
    lectura = interpretar(salida.stdout)
    if lectura["cpu"] is None and not lectura["ventiladores"]:
        raise RuntimeError("powermetrics no devolvió sensores en este Mac")
    lectura["fuente"] = "powermetrics"
    return lectura


def leer_sensores():
    errores = []
    falla = preparar_lector()
    if falla is None:
        try:
            return leer_smc()
        except Exception as e:
            errores.append(str(e))
    else:
        errores.append(falla)
    try:
        return leer_powermetrics()
    except Exception as e:
        errores.append(str(e))
    raise RuntimeError(" · ".join(errores))


def leer_demo(t):
    """Plausible iMac 2011 numbers: a slow wave with occasional load spikes."""
    pico = 18 if (t // 40) % 5 == 4 else 0
    cpu = 52 + 9 * math.sin(t / 37) + pico + random.uniform(-1, 1)
    gpu = 61 + 6 * math.sin(t / 53 + 1) + pico * 0.6 + random.uniform(-0.8, 0.8)
    return {
        "cpu": round(cpu, 1), "gpu": round(gpu, 1),
        "ventiladores": [round(1100 + (cpu - 45) * 38), 1100, round(1000 + (gpu - 50) * 30)],
        "otras": {"Disco": round(40 + random.uniform(-.5, .5), 1), "Ambiente": 27.5},
        "nivelTermico": {"CPU": 1 if cpu > 80 else 0},
        "encendidoDesde": time.time() - 3 * 3600 - 1260,
        "uso": round(35 + 20 * math.sin(t / 23)),
        "procesos": [{"pid": 151, "nombre": "WindowServer", "cpu": 14.2}, {"pid": 402, "nombre": "mds_stores", "cpu": 9.8},
                     {"pid": 88, "nombre": "Google Chrome Helper", "cpu": 6.1}, {"pid": 0, "nombre": "kernel_task", "cpu": 3.4}],
    }


USO = re.compile(r"CPU usage:\s*([\d.]+)% user,\s*([\d.]+)% sys,\s*([\d.]+)% idle")
PROCESO = re.compile(r"^\s*(\d+)\s+(.+?)\s+([\d.]+)\s*$")


def interpretar_top(texto, nucleos):
    """Real CPU use and the busiest processes from the last sample of
    `top -l 2 ...`. The first sample is skipped: its percentages are averaged
    since boot. Process %CPU is per core, so it is divided by the core count
    to show each process's share of the whole machine."""
    muestra = texto.split("Processes:")[-1]
    m = USO.search(muestra)
    uso = round(float(m.group(1)) + float(m.group(2))) if m else None
    procesos = []
    tabla = muestra.split("%CPU", 1)[-1] if "%CPU" in muestra else ""
    for linea in tabla.splitlines():
        p = PROCESO.match(linea)
        if p and float(p.group(3)) > 0:
            procesos.append({"pid": int(p.group(1)), "nombre": p.group(2).strip(),
                             "cpu": round(float(p.group(3)) / nucleos, 1)})
    return uso, procesos[:6]


def uso_cpu(nucleos):
    try:
        r = subprocess.run(["top", "-l", "2", "-s", "1", "-n", "8", "-o", "cpu", "-stats", "pid,command,cpu"],
                           capture_output=True, text=True, timeout=15)
        return interpretar_top(r.stdout, nucleos)
    except (OSError, subprocess.TimeoutExpired):
        return None, []


def sistema():
    carga = os.getloadavg()
    nucleos = os.cpu_count() or 1
    uso, procesos = uso_cpu(nucleos)
    arranque = None
    try:
        crudo = subprocess.run(["sysctl", "-n", "kern.boottime"], capture_output=True, text=True).stdout
        m = re.search(r"sec = (\d+)", crudo)
        arranque = int(m.group(1)) if m else None
    except OSError:
        pass
    return {"uso": uso, "procesos": procesos, "cargaPromedio": round(carga[0], 2),
            "nucleos": nucleos, "encendidoDesde": arranque}


def muestrear(demo):
    inicio = time.time()
    while True:
        try:
            if demo:
                lectura = leer_demo(time.time() - inicio)
                time.sleep(INTERVALO_MS / 1000)
            else:
                lectura = leer_sensores()
            datos_sistema = sistema()
            for clave in ("encendidoDesde", "uso", "procesos"):
                if lectura.get(clave) is not None:
                    datos_sistema.pop(clave)
            lectura.update(datos_sistema, hora=time.time())
            with candado:
                estado["actual"] = lectura
                estado["error"] = None
                estado["historial"].append({"t": lectura["hora"], "cpu": lectura["cpu"], "gpu": lectura["gpu"]})
        except Exception as e:  # keep serving the page and show the error there
            with candado:
                estado["error"] = str(e)
            time.sleep(5)


class Manejador(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(CARPETA / "panel"), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/datos"):
            with candado:
                cuerpo = json.dumps({
                    "actual": estado["actual"], "historial": list(estado["historial"]),
                    "error": estado["error"], "demo": estado["demo"],
                }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(cuerpo)
        else:
            super().do_GET()

    def log_message(self, *args):
        pass


def main():
    p = argparse.ArgumentParser(description="Monitor de temperatura del iMac")
    p.add_argument("--demo", action="store_true", help="datos simulados, sin sensores")
    p.add_argument("--puerto", type=int, default=PUERTO)
    args = p.parse_args()
    estado["demo"] = args.demo
    threading.Thread(target=muestrear, args=(args.demo,), daemon=True).start()
    # Only this Mac can open the panel.
    servidor = ThreadingHTTPServer(("127.0.0.1", args.puerto), Manejador)
    print(f"Panel en http://localhost:{args.puerto}  (Ctrl+C para salir)")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

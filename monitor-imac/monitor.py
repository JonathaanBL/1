#!/usr/bin/env python3
"""Temperature monitor for an Intel iMac: reads the SMC sensors through Apple's
powermetrics and serves a live dashboard at http://localhost:8787.

    sudo python3 monitor.py           # real sensors (powermetrics needs root)
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


def leer_sensores():
    salida = subprocess.run(
        ["powermetrics", "--samplers", "smc", "-i", str(INTERVALO_MS), "-n", "1"],
        capture_output=True, text=True, timeout=30,
    )
    if salida.returncode != 0:
        raise RuntimeError(salida.stderr.strip() or "powermetrics no respondió")
    lectura = interpretar(salida.stdout)
    if lectura["cpu"] is None and not lectura["ventiladores"]:
        raise RuntimeError("powermetrics no devolvió sensores en este Mac")
    return lectura


def leer_demo(t):
    """Plausible iMac 2011 numbers: a slow wave with occasional load spikes."""
    pico = 18 if (t // 40) % 5 == 4 else 0
    cpu = 52 + 9 * math.sin(t / 37) + pico + random.uniform(-1, 1)
    gpu = 61 + 6 * math.sin(t / 53 + 1) + pico * 0.6 + random.uniform(-0.8, 0.8)
    return {
        "cpu": round(cpu, 1), "gpu": round(gpu, 1), "otras": {},
        "ventiladores": [round(1100 + (cpu - 45) * 38), 1100, round(1000 + (gpu - 50) * 30)],
        "nivelTermico": {"CPU": 1 if cpu > 80 else 0},
        "encendidoDesde": time.time() - 3 * 3600 - 1260,
    }


def sistema():
    carga = os.getloadavg()
    nucleos = os.cpu_count() or 1
    arranque = None
    try:
        crudo = subprocess.run(["sysctl", "-n", "kern.boottime"], capture_output=True, text=True).stdout
        m = re.search(r"sec = (\d+)", crudo)
        arranque = int(m.group(1)) if m else None
    except OSError:
        pass
    return {"carga": round(carga[0] / nucleos * 100), "nucleos": nucleos,
            "encendidoDesde": arranque}


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
            if lectura.get("encendidoDesde"):
                datos_sistema.pop("encendidoDesde")
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
    if not args.demo and os.geteuid() != 0:
        raise SystemExit("powermetrics necesita permisos de administrador: ejecuta  sudo python3 monitor.py")
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

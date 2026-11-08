#!/bin/bash
# Doble clic para abrir el monitor: pide tu contraseña del Mac (powermetrics
# necesita permisos de administrador) y abre el panel en el navegador.
cd "$(dirname "$0")" || exit 1
(sleep 4; open "http://localhost:8787") &
sudo /usr/bin/python3 monitor.py

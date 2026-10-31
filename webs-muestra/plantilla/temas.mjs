// One look per kind of business. `tipo` in a business file picks the theme;
// anything unknown falls back to "general".
export const TEMAS = {
  restaurante: {
    fuentes: "Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;600",
    titulo: '"Fraunces", Georgia, serif',
    texto: '"Manrope", system-ui, sans-serif',
    fondo: "#16110e", superficie: "#211a15", tinta: "#f3eadf", suave: "#c9bba9",
    acento: "#e0773b", sobreAcento: "#1a0f08",
    degradado: "radial-gradient(120% 90% at 20% 10%, #5a2c17 0%, #16110e 60%)",
  },
  barberia: {
    fuentes: "Bebas+Neue&family=Manrope:wght@400;600",
    titulo: '"Bebas Neue", Impact, sans-serif',
    texto: '"Manrope", system-ui, sans-serif',
    fondo: "#0f0f10", superficie: "#1a1a1c", tinta: "#f4f1ea", suave: "#b9b4a8",
    acento: "#c9a46a", sobreAcento: "#16120b",
    degradado: "repeating-linear-gradient(135deg, #1a1a1c 0 18px, #141416 18px 36px)",
    mayusculas: true,
  },
  belleza: {
    fuentes: "Cormorant+Garamond:wght@500;700&family=Manrope:wght@400;600",
    titulo: '"Cormorant Garamond", Georgia, serif',
    texto: '"Manrope", system-ui, sans-serif',
    fondo: "#f7efe9", superficie: "#ffffff", tinta: "#2b2024", suave: "#6e5c62",
    acento: "#b0566a", sobreAcento: "#ffffff",
    degradado: "radial-gradient(110% 90% at 80% 0%, #f1cfd6 0%, #f7efe9 65%)",
  },
  taller: {
    fuentes: "Archivo+Black&family=Manrope:wght@400;600",
    titulo: '"Archivo Black", Impact, sans-serif',
    texto: '"Manrope", system-ui, sans-serif',
    fondo: "#121417", superficie: "#1c2025", tinta: "#eef1f4", suave: "#a9b1ba",
    acento: "#f2b705", sobreAcento: "#121417",
    degradado: "linear-gradient(160deg, #2a3037 0%, #121417 70%)",
  },
  salud: {
    fuentes: "Plus+Jakarta+Sans:wght@400;600;800",
    titulo: '"Plus Jakarta Sans", system-ui, sans-serif',
    texto: '"Plus Jakarta Sans", system-ui, sans-serif',
    fondo: "#f4f8f8", superficie: "#ffffff", tinta: "#10302e", suave: "#4b6664",
    acento: "#0f766e", sobreAcento: "#ffffff",
    degradado: "radial-gradient(120% 90% at 90% 0%, #cdeae6 0%, #f4f8f8 60%)",
  },
  gimnasio: {
    fuentes: "Anton&family=Manrope:wght@400;600",
    titulo: '"Anton", Impact, sans-serif',
    texto: '"Manrope", system-ui, sans-serif',
    fondo: "#0d0d0d", superficie: "#191919", tinta: "#f5f5f5", suave: "#b3b3b3",
    acento: "#ff4d2e", sobreAcento: "#0d0d0d",
    degradado: "linear-gradient(150deg, #3a120b 0%, #0d0d0d 65%)",
    mayusculas: true,
  },
  general: {
    fuentes: "DM+Serif+Display&family=Manrope:wght@400;600",
    titulo: '"DM Serif Display", Georgia, serif',
    texto: '"Manrope", system-ui, sans-serif',
    fondo: "#f6f3ee", superficie: "#ffffff", tinta: "#1c2433", suave: "#59627a",
    acento: "#1f4fd1", sobreAcento: "#ffffff",
    degradado: "radial-gradient(120% 90% at 85% 0%, #dde5fb 0%, #f6f3ee 60%)",
  },
};

// Maps the many ways a business type gets written (Google categories, Spanish,
// English) onto a theme.
const SINONIMOS = [
  [/restaur|food|comida|parrilla|grill|pizz|sushi|taquer|cafe|café|coffee|bakery|panader|pasteler|bar\b|bistro/i, "restaurante"],
  [/barber|barbería|barberia/i, "barberia"],
  [/beauty|belleza|salon|salón|nail|manicur|uña|spa|estética|estetica|peluquer|hair/i, "belleza"],
  [/auto|mec[aá]nic|taller|repair|car |tire|neum[aá]tic|garage/i, "taller"],
  [/dent|clinic|cl[ií]nic|m[eé]dic|doctor|salud|health|vet|pet|mascota|fisio|psic/i, "salud"],
  [/gym|gimnasio|fitness|crossfit|yoga|pilates|box/i, "gimnasio"],
];

export function temaPara(tipo = "") {
  if (TEMAS[tipo]) return tipo;
  for (const [patron, tema] of SINONIMOS) if (patron.test(tipo)) return tema;
  return "general";
}

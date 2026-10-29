# Liliiixi · link in bio

Página personal para poner en la bio de TikTok ([@liliiixi1](https://www.tiktok.com/@liliiixi1)).

Hecha con React, Vite y Tailwind CSS. La tarjeta de perfil y el fondo animado están adaptados de componentes de [21st.dev](https://21st.dev).

## Cambiar el contenido

- Nombre, usuario, bio y enlace de TikTok: `src/profile.ts`
- Foto de perfil: reemplaza `public/avatar.jpg`
- Botones de redes: la lista `socialLinks` en `src/App.tsx`
- Colores del fondo: `GRADIENT_COLORS` en `src/App.tsx`

## Publicación

La página está en https://jonathaanbl.github.io/1/. Cada vez que se sube un cambio de la carpeta `tiktok/` a la rama `claude/link-in-bio`, GitHub Actions la compila y la publica sola en la rama `gh-pages` (ver `.github/workflows/deploy-tiktok.yml`). Tarda uno o dos minutos.

## Comandos

```bash
npm install
npm run dev      # servidor local
npm run build    # genera la carpeta dist/ para publicar
npm run lint
```

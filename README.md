# Joyería Andrea

Landing estática de Joyería Andrea: joyas, relojes, regalos y servicios en Chorrillos. La compra y las cotizaciones se coordinan por WhatsApp. Sin carrito, pagos web, formularios ni base de datos.

Dominio principal previsto: **https://joyeriaandrea.pe/**. Repositorio: **https://github.com/Levram23/joyeriandrea**. Subir a GitHub no activa GitHub Pages ni publica por sí solo la web.

## Ejecutar y comprobar

Usar Node.js 22 (definido en `.node-version`). No se necesita instalar paquetes.

```sh
node scripts/build.cjs
node scripts/check.cjs
node server.cjs
```

Abrir http://127.0.0.1:4173/. Con el servidor activo:

```sh
node scripts/check-http.cjs
```

`PORT` permite cambiar el puerto local; `SITE_TEST_URL` permite comprobar otra dirección. El servidor local no reproduce las cabeceras ni redirecciones de Cloudflare; estas deben verificarse en el despliegue.

## Publicar con Cloudflare Pages

Conectar **el repositorio existente** mediante la integración GitHub de Cloudflare Pages. Usar el plan gratuito y estos valores:

| Opción | Valor |
|---|---|
| Rama de producción | `main` |
| Framework | None |
| Directorio raíz | raíz del repositorio (vacío) |
| Comando de compilación | `node scripts/build.cjs && node scripts/check.cjs` |
| Carpeta de salida | `dist` |
| Node | 22, leído de `.node-version`; si el panel lo requiere, `NODE_VERSION=22` |
| Secretos de compilación | Ninguno |

No se necesita token de Cloudflare en el código o en variables del navegador. La autorización de GitHub se realiza en el panel de Cloudflare y debe limitarse a este repositorio cuando sea posible.

1. Verificar la dirección `pages.dev` asignada por Cloudflare: portada, imágenes, WhatsApp, mapa, robots, sitemap y 404.
2. Añadir `joyeriaandrea.pe` y `www.joyeriaandrea.pe` como dominios personalizados. Para el dominio raíz, Cloudflare requiere que la zona use sus servidores de nombres.
3. Revisar/importar registros DNS existentes antes de cambiar la delegación. Conservar correo (MX, SPF, DKIM, DMARC), verificaciones y otros servicios. Usar solo los servidores de nombres exactos asignados por Cloudflare.
4. Crear una redirección permanente 301 de `www` a `https://joyeriaandrea.pe`, preservando ruta y parámetros. Hacerla en las reglas del dominio de Cloudflare: `_redirects` de Pages no admite redirecciones basadas en dominio.
5. Verificar certificados y HTTPS de ambos nombres, redirección www, dominio raíz, recursos y metadatos. No considerar terminado el lanzamiento mientras DNS o certificados estén pendientes.

`dist/404.html` evita que las rutas inexistentes devuelvan falsamente la portada con 200. `_redirects` normaliza `/index.html`; `_headers` añade cabeceras básicas y excluye de indexación las direcciones temporales `pages.dev`, sin bloquear el dominio principal. Se conservan las políticas de caché predeterminadas de Pages.

## Actualizar contenido

- `src/data.js`: información pública del negocio, categorías, servicios, horarios, materiales, redes y pagos. Mantener coherentes los horarios visibles y estructurados.
- `src/index.html`: estructura y textos. No editar directamente el HTML generado en `dist/index.html`.
- `site.config.json`: SEO y canonical. `indexable: true` habilita la versión de producción y su sitemap. Usar `false` para una revisión local que no deba indexarse, sin subir ese cambio a producción inadvertidamente.
- `dist/styles.css`: apariencia y adaptación móvil.
- `dist/app.js`: menú móvil; el contenido importante y los enlaces ya vienen en el HTML.
- `dist/assets/`: imágenes optimizadas y originales públicos conservados para su mantenimiento.

Después de editar: generar, comprobar y revisar localmente; luego hacer commit y push a `main`. Una vez conectada la integración, Cloudflare recompilará automáticamente. No usar force-push. La web solo necesita publicar la carpeta `dist`.

### Imágenes

Las imágenes son de referencia y no prueban stock, certificaciones o materiales. La portada no se declara como fotografía real de la tienda. WebP de 480, 800 y 1120 px, dimensiones HTML y carga prioritaria de portada están incluidos en el repositorio; no se necesita Python para desplegar.

Solo para regenerar derivados tras reemplazar las fuentes PNG: ejecutar `python scripts/optimize-images.py` (requiere Pillow), después `build` y `check`. Revisar `src/images.json`, los textos alternativos y el renderizado de categorías al cambiar las fuentes.

## Seguridad y comprobaciones

`.gitignore` excluye `.env`, variables locales, claves, cachés, logs y capturas de revisión. Nunca guardar contraseñas o tokens en `src/`, `dist/` ni en Git. El sitio no necesita credenciales privadas.

Comprobación opcional de credenciales con Python estándar:

```sh
python scripts/scan-secrets.py --history
```

Es un detector heurístico: informa ubicación/tipo sin mostrar valores; no garantiza reconocer todos los formatos. Si se detecta un secreto real, revocarlo primero, reemplazarlo y coordinar la limpieza del historial antes de continuar.

Las pruebas comprueban HTML estático, canonical, JSON-LD, imágenes, anclas, enlaces de WhatsApp y respuestas HTTP. No envían mensajes ni compras. No hay formularios que simulen envíos. Los servicios externos y los Core Web Vitals requieren verificación en producción; no se prometen posiciones en Google.

## Google Search Console después de publicar

1. Verificar la propiedad de dominio `joyeriaandrea.pe` con el TXT DNS que entregue Google; conservar los registros existentes.
2. Inspeccionar `https://joyeriaandrea.pe/`, ejecutar la prueba publicada y revisar HTTPS, canonical, HTML renderizado y ausencia de bloqueos de indexación.
3. Enviar `https://joyeriaandrea.pe/sitemap.xml` cuando responda 200.
4. Revisar Rich Results Test, Schema Markup Validator y PageSpeed Insights móvil/escritorio.
5. Mantener horarios y dirección coherentes con el Perfil de Empresa. Seguir indexación, consultas, clics y Core Web Vitals cuando haya datos suficientes.

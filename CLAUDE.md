# CLAUDE.md

Contexto para Claude Code al trabajar en este proyecto.

## Qué es

Curso interactivo de Excel (estilo Codecademy) para preparar a Gerard para un puesto de Analista de Datos / BI. Sitio estático sin build: HTML + CSS + JS puro, desplegado en Vercel.

## Reglas del proyecto

- Todo el contenido y la interfaz en español, tono informal y directo.
- Mantener archivos separados (HTML / CSS / JS / contenido por bloque). Nada de meter todo en un solo HTML.
- Comentarios solo donde aportan; nada de banners ni separadores con ASCII.
- Sin frameworks ni dependencias salvo que se pida explícitamente.
- Funciones de Excel con nombres en inglés (el Excel de Gerard está en inglés); el motor acepta también los nombres en español.
- Navegación de Excel siempre exacta: `Pestaña > Grupo > Botón`.

## Arquitectura

- `js/engine.js`: tokenizer + parser recursivo + evaluador. Valores: number, string, boolean, null, `XErr` (errores tipo #N/A) y `M` (matriz, para resultados derramados). `lift()` aplica funciones elemento a elemento con broadcasting. `F` es el mapa de funciones; las que reciben `ctx` (para resaltar filas con `ctx.mask`) están en `CTX_FNS`.
- `js/content/*.js`: datos del curso. Ver README para el esquema de lecciones y ejercicios.
- `js/store.js`: estado en localStorage. XP y niveles NO se guardan: se calculan del estado en `app.js`.
- `js/app.js`: router por hash (`#inicio`, `#laboratorio`, `#certificado`, `#progreso`, `#<lessonId>`, `#quiz-<blockId>`), vistas y celebraciones (`celebrateDiff`).

## Antes de terminar un cambio de contenido

Verifica que cada `sol` / `verify` evalúe sin error con el motor. Un script rápido en Node:

```js
global.window = global;
const fs = require('fs');
eval(fs.readFileSync('js/engine.js', 'utf8'));
eval(fs.readFileSync('js/content/datasets.js', 'utf8'));
for (const f of fs.readdirSync('js/content').filter((f) => f.startsWith('b')).sort()) eval(fs.readFileSync('js/content/' + f, 'utf8'));
const T = Object.values(COURSE.tables);
for (const b of COURSE.blocks) for (const l of b.lessons) for (const e of l.exercises || []) {
  const f = e.sol || e.verify; if (!f) continue;
  const r = XL.evaluate(f, T);
  if (!r.ok || (e.must || []).some((m) => !r.ctx.fns.has(m))) console.log('REVISAR', e.id, r.ok ? '' : r.error.msg);
}
```

## Ideas pendientes

- Sincronizar progreso entre dispositivos (Supabase / Firebase).
- Bloque extra: Power Pivot y modelo de datos (DAX básico), What-If (Goal Seek, Scenario Manager, Data Tables), Solver, gráficos avanzados (combo, Pareto, cascada), LAMBDA.
- Modo repaso: ejercicios aleatorios de bloques ya completados.

# Ruta Excel Analista

Curso interactivo de Excel para Analista de Datos / BI. Va desde fórmulas intermedias hasta Power Query y VBA, practicando con los datos de "La Tienda de Don Pepe".

- 12 bloques, 49 lecciones, 180 ejercicios autocorregidos
- Simulador de fórmulas tipo Excel (inglés o español, separador `,` o `;`)
- Quiz por bloque (80% para aprobar), XP, racha, niveles y certificado
- Sitio estático: HTML + CSS + JavaScript puro, sin dependencias ni build

## Estructura

```
ruta-excel-analista/
├── index.html                 Página principal (carga todos los scripts en orden)
├── css/
│   └── styles.css             Estilos, tema claro/oscuro y responsive
├── supabase/
│   └── schema.sql             Tabla de progreso y políticas RLS
└── js/
    ├── config.js              URL y anon key de Supabase (pública)
    ├── engine.js              Motor de fórmulas (parser + funciones de Excel)
    ├── store.js               Progreso del alumno (localStorage + cuenta en Supabase)
    ├── app.js                 Interfaz: vistas, ejercicios, quiz, celebraciones
    └── content/
        ├── datasets.js        Tablas de práctica (tblVentas, tblVendedores, tblBonos, tblClientes)
        ├── b00-repaso.js      Bloque 0: Tu base
        ├── b01-agregacion.js  Bloque 1: SUMIFS, COUNTIFS, AVERAGEIFS, MAXIFS, SUMPRODUCT
        ├── b02-logica.js      Bloque 2: AND/OR, IFS, IFERROR, SWITCH, IS...
        ├── b03-busqueda.js    Bloque 3: XLOOKUP, INDEX+MATCH, VLOOKUP
        ├── b04-fechas.js      Bloque 4: fechas
        ├── b05-texto.js       Bloque 5: texto y limpieza
        ├── b06-dinamicas.js   Bloque 6: UNIQUE, FILTER, SORT, LET
        ├── b07-estadistica.js Bloque 7: estadística y ranking
        ├── b08-dinamicas-dashboard.js  Bloque 8: tablas dinámicas y dashboards
        ├── b09-power-query.js Bloque 9: Power Query
        ├── b10-vba.js         Bloque 10: macros y VBA
        └── b11-proyecto.js    Bloque 11: proyecto final y examen
```

## Correr en local

Abre `index.html` en el navegador. Si prefieres un servidor local:

```bash
npx serve .
```

## Subir a Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. En vercel.com: **Add New > Project** > importa el repo.
3. Framework Preset: **Other**. Build Command: vacío. Output Directory: `.` (raíz).
4. **Deploy**.

O con la CLI, desde esta carpeta: `npx vercel` y luego `npx vercel --prod`.

## Progreso y cuentas

El progreso siempre se guarda en el navegador (`localStorage`). Si el alumno crea una cuenta, también se sube a Supabase y lo ve igual desde cualquier dispositivo. Sin librerías: `js/store.js` habla directo con la API REST de Supabase (Auth y PostgREST). Cada alumno solo puede leer y escribir su propia fila (RLS).

Para activarlo:

1. En [supabase.com](https://supabase.com) crea un proyecto.
2. **SQL Editor**: pega y ejecuta `supabase/schema.sql`.
3. **Authentication > Sign In / Providers > Email**: desactiva "Confirm email" (así quien se registra entra al instante).
4. **Authentication > URL Configuration**: en *Site URL* pon la URL de Vercel (la usan los correos de recuperar contraseña).
5. **Project Settings > API**: copia *Project URL* y la *anon / publishable key* a `js/config.js`.
6. Vuelve a desplegar.

Si `js/config.js` queda vacío, la página funciona igual pero sin cuentas (solo navegador).

Al juntar dispositivos nada se pierde: ejercicios, quizzes, días y XP se suman. Reiniciar el progreso en un dispositivo lo reinicia en todos. Cerrar sesión borra el progreso de ese navegador (queda a salvo en la cuenta).

## Cómo agregar contenido

Cada bloque es un archivo en `js/content/` que hace `COURSE.blocks.push({...})`. Una lección tiene:

| Campo | Qué es |
|---|---|
| `id` | Único, solo letras, números y guiones (se usa en la URL `#id`) |
| `title`, `fns` | Título y chips de funciones |
| `tables` | Tablas que se muestran en la práctica |
| `why`, `syntax`, `read`, `steps`, `tips`, `mistakes` | Teoría (HTML permitido) |
| `example` | `{ f: '=FORMULA', explain: '...' }` |
| `copies` | Botones para copiar datos a Excel |
| `code` | Bloques de VBA con botón copiar |
| `doit` / `requireDoit` | Checklist "Hazlo en tu Excel" (obligatorio si `requireDoit: true`) |
| `exercises` | Lista de ejercicios |

Tipos de ejercicio:

- `formula` (por defecto): `sol` es la fórmula correcta; el resultado esperado se calcula solo. `must` = funciones obligatorias, `banFns` = funciones prohibidas, `ban` = referencias prohibidas.
- `value`: el alumno escribe el número que le dio Excel; `verify` es la fórmula que calcula la respuesta. `pct: true` acepta % o decimal.
- `choice`: opciones `o`, índice correcto `a`, explicación `why`.

Si el ejercicio usa una función que el motor no tiene, agrégala en el objeto `F` de `js/engine.js` (y su firma en `SIG`).

# MiRutaRapidaNorte

Aplicación web para los conductores de las rutas **2, 13 y 22** de Tunja en el tramo **Glorieta del Gobernador → C.C. Green Hills** (sentido Sur-Norte). Muestra la espera estimada en cada paradero y, con el algoritmo de **Dijkstra**, recomienda si conviene saltarse una parada congestionada.

Proyecto final de Matemáticas Discretas (2026).
**Autores:** Sebastian Gonzales Ramirez, Jennifer Granados Nossa, Samir Esneider Borda, Nicolas Bastidas Medina.
**Docente:** Javier Ballesteros.

## Qué hace

- Inicio de sesión del busetero (nombre, contraseña y ruta).
- Mapa con solo los nodos de los 9 paraderos, coloreados según la espera (verde, ámbar, rojo).
- Cada paradero muestra la espera estimada, los buses detenidos y los que van llegando. El encabezado muestra el total de buses activos.
- El sistema asigna automáticamente la siguiente parada. El chofer informa cuando **llega** y cuando **sale**.
- El chofer puede elegir otra parada en el mapa y ver al instante su espera y su llegada estimada.
- Si la espera se acumula, la app recomienda saltar una o más paradas.
- El estado de los buses se guarda en JSON o en Postgres.

Para la explicación detallada (modelo matemático, algoritmo, API, ejemplo resuelto), ver [FUNCIONAMIENTO.md](FUNCIONAMIENTO.md).

## Requisitos

- Node.js 18 o superior (20.6 o superior si usas `npm run dev`).

## Instalación y uso local

```bash
npm install
cp .env.example .env     # opcional, ajusta las variables
npm run dev              # carga .env (Node >= 20.6)
# o simplemente:
npm start
```

Abre `http://localhost:3000`. Para simular varios buses, abre ventanas de incógnito o distintos navegadores, cada una con un usuario diferente.

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto del servidor (Render lo asigna solo) | `3000` |
| `DATABASE_URL` | Conexión a Postgres. Si está vacía se usa el archivo JSON | vacía |
| `SKIP_PENALTY` | Segundos de castigo por cada parada omitida | `45` |
| `STATE_FILE` | Ruta del JSON cuando no hay Postgres | `data/state.json` |

## Estructura

```
MiRutaRapidaNorte/
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── FUNCIONAMIENTO.md
├── server/                 (no es accesible desde el navegador)
│   ├── index.js            API, login y cabeceras de seguridad
│   ├── graph.js            paradas, modelo de espera y Dijkstra
│   └── storage.js          persistencia JSON o Postgres
└── public/src/
    ├── html/index.html
    ├── css/styles.css
    └── js/app.js
```

## Despliegue en Render

1. Sube el repositorio a GitHub.
2. Crea un **Web Service** con build `npm install` y start `npm start`.
3. En *Environment* agrega `DATABASE_URL` (la Internal Database URL de tu Postgres) y, si quieres, `SKIP_PENALTY`.

Sobre el plan gratuito de Render:

- El disco de un servicio gratuito es **efímero**: el JSON se pierde en cada reinicio, redeploy o suspensión (se suspende tras 15 minutos sin tráfico).
- El Postgres gratuito **expira a los 30 días** de creado (con 14 días de gracia). Para algo más duradero puedes usar un Postgres externo gratuito, como Neon, con la misma variable `DATABASE_URL`.
- Las condiciones del plan gratuito pueden cambiar. Confírmalas en la documentación de Render antes de desplegar.

## Seguridad

- El código del servidor y los datos quedan fuera de la carpeta pública.
- Política de seguridad de contenido (CSP) que solo permite scripts y estilos propios, sin código en línea.
- Cabeceras `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, entre otras.
- Contraseñas con `scrypt` y sal individual; comparación a tiempo constante.
- Límite de 10 intentos fallidos de login por IP cada 10 minutos.
- Sesiones por token con vencimiento de 12 horas y peticiones limitadas a 5 KB.

## Limitaciones conocidas

- No usa GPS: el sistema se entera de las llegadas y salidas porque el chofer las informa.
- El modelo de espera es una simplificación (ver FUNCIONAMIENTO.md, sección de supuestos).
- Cualquier persona puede crear una cuenta; no hay un administrador que valide a los conductores.

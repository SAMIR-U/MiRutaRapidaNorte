# MiRutaRapidaNorte

Aplicación web para los conductores de las rutas **2, 13 y 22** de Tunja en el tramo **Glorieta del Gobernador → C.C. Green Hills** (sentido Sur-Norte). Muestra la espera estimada en cada paradero y, con el algoritmo de **Dijkstra**, recomienda si conviene saltarse una parada congestionada.

Proyecto final de Matemáticas Discretas (2026).
**Autores:** Sebastian Gonzales Ramirez, Jennifer Granados Nossa, Samir Esneider Borda, Nicolas Bastidas Medina.
**Docente:** Javier Ballesteros.

## Contenido de este documento

Este README sirve como dos manuales y una referencia técnica:

1. [Manual de usuario final](#parte-1--manual-de-usuario-final): para el busetero que usa la aplicación.
2. [Manual de despliegue en local](#parte-2--manual-de-despliegue-en-local): para quien instala y ejecuta el proyecto en su computador.
3. [Referencia técnica](#parte-3--referencia-técnica): estructura, variables, API, seguridad, despliegue en Render y limitaciones.

Para la explicación detallada del modelo matemático, el algoritmo y un ejemplo resuelto, ver [FUNCIONAMIENTO.md](FUNCIONAMIENTO.md).

## Probar la aplicación en línea

Para probar la aplicación sin instalar nada, entra a: **<https://mirutarapidanorte.onrender.com/>**

Está alojada en el plan gratuito de Render, que suspende el servicio tras 15 minutos sin tráfico. Si la página tarda en abrir la primera vez, espera un momento mientras el servicio se reactiva. Además, los datos pueden reiniciarse (ver la [sección 3.7](#37-despliegue-en-render)).

---

# Parte 1 · Manual de usuario final

## 1.1 ¿Para qué sirve?

En las paradas de la ruta se acumulan buses y los pasajeros se reparten mal: unas paradas quedan llenas de buses esperando y otras quedan vacías. MiRutaRapidaNorte te ayuda a **regular tu recorrido**:

- Te muestra cuánto se espera en cada paradero.
- Te asigna automáticamente la siguiente parada.
- Te avisa cuando se te acaba el turno de espera.
- Te recomienda saltarte una o más paradas cuando hay mucha congestión.

Cubre 9 paraderos, de Makro hasta el Campus deportivo Uniboyacá, saliendo de la Glorieta del Gobernador.

## 1.2 Qué necesitas

- Un celular o computador con navegador web actualizado (Chrome, Edge, Firefox o Safari).
- Conexión a internet (o a la red local, si el sistema está instalado en un computador propio).
- La dirección web de la aplicación: <https://mirutarapidanorte.onrender.com/> (o la que te dé el administrador del sistema). En una instalación local es `http://localhost:3000`.

No necesitas instalar nada en tu equipo.

## 1.3 Ingresar a la aplicación

1. Abre la dirección de la aplicación en el navegador.
2. Escribe tu **nombre** y una **contraseña** (mínimo 4 caracteres).
3. Elige tu **ruta**: 2, 13 o 22.
4. Pulsa **Ingresar**.

Datos importantes:

- **Primera vez:** si tu nombre no existe, la cuenta se crea en ese momento con la contraseña que escribiste. Anótala: no hay opción de recuperarla.
- **Siguientes veces:** usa el mismo nombre y la misma contraseña. El nombre no distingue mayúsculas de minúsculas.
- Puedes cambiar de ruta al ingresar; se guarda la última que elijas.
- Si fallas la contraseña 10 veces en 10 minutos, el sistema te bloquea temporalmente. Espera unos minutos y vuelve a intentar.
- Tu sesión dura 12 horas. Pasado ese tiempo debes ingresar de nuevo.

## 1.4 Conocer la pantalla

### Encabezado

- A la izquierda, tu ruta (por ejemplo «Ruta 13»).
- Al centro, cuántos **buses activos** hay en total.
- El botón **🔊 / 🔇** activa o silencia la alarma de sonido.
- El botón **Salir** cierra tu sesión.

### Mapa

El mapa muestra los 9 paraderos en el orden del recorrido, empezando por la **Glorieta**. Cada paradero es un círculo numerado con tres datos:

- **Nombre** de la parada.
- **Tiempo de espera** estimado (formato minutos:segundos).
- **Buses**: cuántos están detenidos allí («aquí») y cuántos van llegando («en ruta»).

El color indica qué tan congestionada está la parada:

| Color | Espera | Significado |
|---|---|---|
| Verde | Menos de 30 segundos | Poca espera |
| Ámbar | Entre 30 segundos y 1:40 | Espera media |
| Rojo | Más de 1:40 | Mucha espera |

En el mapa también aparecen estas marcas:

| Marca | Qué significa |
|---|---|
| **Tú** (bus de frente) | Tu posición. Va entre dos paradas si estás en trayecto, o al lado del círculo si estás detenido en una parada |
| **Destino** (etiqueta amarilla) | La parada a la que te diriges |
| **Sugerida** (etiqueta azul) | Parada que recomienda el sistema y que aún no has aceptado |
| **Saltar** (etiqueta gris) | Parada que el sistema recomienda omitir |
| Línea sólida | Tu ruta actual |
| Línea punteada | La ruta recomendada, todavía no aceptada |

### Panel inferior

Muestra tu estado actual, los tiempos, las recomendaciones y los botones de acción.

## 1.5 Hacer un trayecto paso a paso

**1. Iniciar.** Cuando estés listo para salir de la Glorieta del Gobernador, pulsa **Iniciar trayecto**. El sistema calcula y te asigna la primera parada.

**2. Ir hacia la parada.** El panel dice «En ruta a Parada N» y muestra la **llegada estimada**, que ya incluye la espera que habrá en esa parada.

**3. Informar tu llegada.** Cuando llegues físicamente a la parada, pulsa **Llegué a la parada**. Tu bus pasa a estar detenido allí y empieza tu turno de espera.

**4. Esperar el turno.** El panel muestra cuánto llevas en la parada y cuánto te queda. El turno de espera es de **2 minutos**.

**5. Informar tu salida.** Cuando salgas, pulsa **Salí de la parada**. El sistema te asigna la siguiente parada y vuelves al paso 2.

**6. Terminar.** En la última parada (Campus deportivo Uniboyacá) el botón dice **Terminar trayecto**. Al pulsarlo se cierra tu recorrido y puedes iniciar otro.

> **Importante:** la aplicación no usa GPS. Se entera de dónde estás solo porque tú pulsas **Llegué** y **Salí**. Si no lo haces, los demás conductores verán datos desactualizados.

## 1.6 Recomendaciones para saltar paradas

Si en la parada a la que vas se acumula mucha espera, el sistema calcula con Dijkstra si te conviene más ir a otra parada más adelante.

Cuando eso pasa verás en el panel un recuadro como:

> Recomendado (Dijkstra): ir a Parada 5 · Quintas, saltando Santoto…

y en el mapa la ruta punteada con las etiquetas **Sugerida** y **Saltar**. Tienes dos opciones:

- Pulsar **Aceptar recomendación**: la ruta pasa a línea sólida y tu destino cambia.
- Ignorarla y continuar a la parada que ya tenías.

La recomendación es una ayuda, no una orden. La decisión final es tuya.

## 1.7 Elegir otra parada

Puedes consultar o elegir cualquier parada **más adelante** de donde estás:

1. Toca un círculo en el mapa.
2. En el panel verás la **espera en esa parada** y **tu llegada estimada**.
3. Si quieres ir allí, pulsa **Ir a esta parada**.

Solo puedes elegir paradas posteriores a la actual. Si eliges una manualmente, el sistema respeta tu elección en tu siguiente salida.

## 1.8 Alarma de fin de turno

Cuando llevas **2 minutos o más** detenido en una parada:

- Aparece una franja de alerta: «¡Tiempo agotado! Tu turno de espera terminó. Sal de la parada para continuar.»
- Suena una alarma repetida.

Para detener la alarma, pulsa **Salí de la parada** (cuando realmente salgas) o silencia el sonido con el botón **🔊** del encabezado. La preferencia de silencio se recuerda en ese navegador.

Nota: los navegadores solo permiten reproducir sonido después de que tocas la pantalla al menos una vez. Si no suena, toca cualquier parte de la pantalla.

## 1.9 Salir

Pulsa **Salir** en el encabezado. Esto cierra la sesión **y elimina tu trayecto activo** del sistema, de modo que dejas de contarte como bus activo.

Si abandonas la aplicación sin salir, tu bus se retira automáticamente tras **40 minutos** sin actividad.

## 1.10 Preguntas frecuentes

**Me dice «Contraseña incorrecta».**
Revisa que el nombre y la contraseña sean los mismos de la primera vez. Si no la recuerdas, pide al administrador que elimine tu usuario.

**Me dice «Demasiados intentos».**
Se superaron 10 intentos fallidos. Espera unos 10 minutos.

**Me dice «Sesión no válida».**
Tu sesión venció o el servidor se reinició. Ingresa de nuevo.

**Me dice «Ya tienes un trayecto activo».**
Ya iniciaste un recorrido. Continúa con el botón que aparece en el panel, o sal y vuelve a entrar.

**No me deja elegir una parada.**
Solo se pueden elegir paradas que estén más adelante de tu parada actual.

**Los datos no cambian o se ven viejos.**
La pantalla se sincroniza con el servidor cada 3 segundos. Verifica tu conexión y recarga la página.

**¿Puedo usarla en varios dispositivos a la vez?**
Con la misma cuenta, ambos dispositivos ven y controlan el mismo bus. Cada conductor debe tener su propia cuenta.

---

# Parte 2 · Manual de despliegue en local

Esta parte explica cómo instalar y ejecutar el proyecto en tu computador, para desarrollo, pruebas o una demostración.

## 2.1 Requisitos

| Requisito | Detalle |
|---|---|
| Node.js | Versión 18 o superior. Se necesita 20.6 o superior para usar `npm run dev` |
| npm | Viene incluido con Node.js |
| Git | Opcional, solo si clonas el repositorio |
| PostgreSQL | **Opcional.** Sin él, el estado se guarda en un archivo JSON |
| Navegador | Chrome, Edge, Firefox o Safari actualizados |

Verifica tus versiones en una terminal (en Windows: PowerShell o CMD):

```bash
node -v
npm -v
```

Si `node` no se reconoce, instala la versión LTS desde <https://nodejs.org> y abre una terminal nueva.

## 2.2 Obtener el código

Con Git:

```bash
git clone <URL-del-repositorio> MiRutaRapidaNorte
cd MiRutaRapidaNorte
```

Sin Git: descarga el ZIP del repositorio, descomprímelo y entra a la carpeta (por ejemplo `MiRutaRapidaNorte-main`) desde la terminal:

```bash
cd MiRutaRapidaNorte-main
```

## 2.3 Instalar dependencias

```bash
npm install
```

Esto crea la carpeta `node_modules` con las dos dependencias del proyecto: `express` y `pg`.

## 2.4 Configurar variables de entorno (opcional)

El proyecto funciona sin configuración, con los valores por defecto. Si quieres cambiarlos:

```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Edita `.env` con cualquier editor de texto:

```env
PORT=3000
DATABASE_URL=
SKIP_PENALTY=45
# STATE_FILE=./data/state.json
```

La descripción de cada variable está en la [sección 3.2](#32-variables-de-entorno).

> **Ojo:** el servidor **no lee `.env` por sí solo**. Solo se carga si arrancas con `npm run dev` (ver 2.5). Con `npm start` las variables deben estar definidas en tu terminal.

## 2.5 Ejecutar el servidor

### Opción A · Con `.env` (recomendada): `npm run dev`

Requiere Node 20.6 o superior. Si tu `package.json` no tiene el script `dev`, agrégalo dentro de `"scripts"`:

```json
"scripts": {
  "start": "node server/index.js",
  "dev": "node --env-file=.env server/index.js"
}
```

Luego:

```bash
npm run dev
```

Este modo falla si no existe el archivo `.env`; créalo primero (paso 2.4).

### Opción B · Sin `.env`: `npm start`

Usa los valores por defecto:

```bash
npm start
```

Para cambiar una variable solo en esa ejecución:

```bash
# Linux / macOS / Git Bash
PORT=3001 SKIP_PENALTY=60 npm start

# Windows PowerShell
$env:PORT=3001; $env:SKIP_PENALTY=60; npm start

# Windows CMD
set PORT=3001 && set SKIP_PENALTY=60 && npm start
```

## 2.6 Verificar que funciona

En la terminal debe aparecer:

```
MiRutaRapidaNorte en puerto 3000 (JSON)
```

La palabra entre paréntesis indica dónde se guarda el estado: `JSON` o `Postgres`.

Luego:

1. Abre `http://localhost:3000` en el navegador.
2. Debes ver el formulario de ingreso de MiRutaRapidaNorte.
3. Crea un usuario, pulsa **Iniciar trayecto** y comprueba que aparece el mapa con los 9 paraderos.

Para detener el servidor, pulsa `Ctrl + C` en la terminal.

## 2.7 Simular varios buses

La aplicación sirve para coordinar varios conductores, así que para probarla necesitas varias sesiones a la vez. Cada sesión debe usar un **usuario distinto**:

- Una ventana normal y una ventana de incógnito.
- Navegadores distintos (Chrome, Firefox, Edge).
- Distintos dispositivos de la misma red (ver 2.9).

Prueba típica: inicia tres usuarios, haz que dos lleguen a la misma parada con **Llegué a la parada** y observa cómo sube la espera (color rojo) y cómo el tercero recibe la recomendación de saltarla.

## 2.8 Usar Postgres local (opcional)

Por defecto el estado vive en `data/state.json`. Si prefieres Postgres:

**1. Levanta una base de datos.** Con Docker:

```bash
docker run --name mirutarapida-db -e POSTGRES_PASSWORD=clave123 -e POSTGRES_DB=mirutarapida -p 5432:5432 -d postgres:16
```

O usa una instalación nativa de PostgreSQL y crea una base de datos vacía llamada `mirutarapida`.

**2. Configura la conexión** en `.env`:

```env
DATABASE_URL=postgres://postgres:clave123@localhost:5432/mirutarapida
```

**3. Arranca** con `npm run dev`. En la terminal debe aparecer `(Postgres)`.

No tienes que crear tablas: el servidor crea automáticamente la tabla `app_state` en el primer arranque.

## 2.9 Acceder desde otro dispositivo de la red local

El servidor escucha en todas las interfaces, así que puedes entrar desde un celular conectado al mismo Wi-Fi:

1. Averigua la IP de tu computador: `ipconfig` en Windows o `ip a` / `ifconfig` en Linux y macOS. Ejemplo: `192.168.1.25`.
2. En el celular abre `http://192.168.1.25:3000`.
3. Si no carga, permite el puerto 3000 en el firewall de tu sistema operativo.

## 2.10 Reiniciar los datos

Con el modo JSON, borra el archivo (con el servidor detenido) y se crea uno limpio en el siguiente arranque:

```bash
# Linux / macOS / Git Bash
rm -rf data

# Windows PowerShell
Remove-Item -Recurse -Force data
```

Esto elimina **todos los usuarios, sesiones y buses**.

Con Postgres, vacía la tabla:

```sql
DELETE FROM app_state;
```

Para eliminar solo un usuario (por ejemplo, alguien que olvidó su contraseña), con el servidor detenido edita `data/state.json` y borra su entrada dentro de `"users"`.

## 2.11 Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `node: command not found` | Node.js no instalado o terminal abierta antes de instalarlo | Instala Node LTS y abre una terminal nueva |
| `Cannot find module 'express'` | No se ejecutó `npm install` | Ejecuta `npm install` en la carpeta del proyecto |
| `EADDRINUSE: address already in use` | El puerto 3000 ya está ocupado | Cierra el otro proceso o usa otro puerto, por ejemplo `PORT=3001` |
| `node: --env-file= is not allowed` o `bad option` | Node anterior a 20.6 | Actualiza Node o usa `npm start` |
| `npm run dev` dice «Missing script: dev» | Falta el script en `package.json` | Agrégalo como en la sección 2.5 |
| `npm run dev` dice que no encuentra `.env` | No se creó el archivo | Copia `.env.example` a `.env` |
| La app arranca pero ignora mi `.env` | Se usó `npm start` | Usa `npm run dev` o define las variables en la terminal |
| Error de conexión a Postgres al arrancar | `DATABASE_URL` incorrecta o base apagada | Verifica usuario, clave, puerto y que Postgres esté corriendo |
| La página queda en blanco | Caché del navegador o error de JavaScript | Recarga con `Ctrl + F5` y revisa la consola del navegador (F12) |
| No suena la alarma | El navegador bloquea audio hasta que haya interacción | Toca la pantalla y verifica que el botón no esté en 🔇 |
| Pierdo mi sesión al reiniciar | Normal con tokens vencidos o datos borrados | Ingresa de nuevo |
| El celular no conecta a la IP del PC | Firewall o redes distintas | Permite el puerto y verifica que ambos estén en la misma red |

---

# Parte 3 · Referencia técnica

## 3.1 Qué hace (resumen funcional)

- Inicio de sesión del busetero (nombre, contraseña y ruta).
- Mapa con los 9 paraderos, coloreados según la espera (verde, ámbar, rojo), con etiquetas cortas y etiquetas de estado (Destino, Sugerida, Saltar).
- El conductor se ve como un bus de frente con la leyenda «Tú»: entre dos nodos si va en trayecto, o al lado del nodo si está en una parada.
- La recomendación de Dijkstra se marca en el mapa con línea punteada; al aceptarla, la ruta queda marcada con línea sólida.
- Cada paradero muestra la espera estimada, los buses detenidos y los que van llegando. El encabezado muestra el total de buses activos.
- El sistema asigna automáticamente la siguiente parada. El chofer informa cuando **llega** y cuando **sale**.
- Al agotarse el turno de espera, muestra una alerta visual y reproduce una alarma que se puede silenciar.
- El chofer puede elegir otra parada en el mapa y ver al instante su espera y su llegada estimada.
- Si la espera se acumula, la app recomienda saltar una o más paradas.
- El estado de los buses se guarda en JSON o en Postgres.

## 3.2 Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto del servidor (Render lo asigna solo) | `3000` |
| `DATABASE_URL` | Conexión a Postgres. Si está vacía se usa el archivo JSON | vacía |
| `SKIP_PENALTY` | Segundos de castigo por cada parada omitida. Más alto = menos saltos recomendados | `45` |
| `STATE_FILE` | Ruta del JSON cuando no hay Postgres | `data/state.json` |

## 3.3 Constantes del modelo

| Constante | Valor | Dónde |
|---|---|---|
| Turno de espera por bus | 120 s (decrece linealmente) | `server/graph.js` y `public/src/js/alarm.js` |
| Verde / ámbar / rojo | < 30 s / < 100 s / ≥ 100 s | `public/src/js/app.js` |
| Bus inactivo retirado | 40 min | `server/index.js` |
| Duración de sesión | 12 h | `server/index.js` |
| Intentos fallidos de login | 10 por IP cada 10 min | `server/index.js` |
| Tamaño máximo de petición | 5 KB | `server/index.js` |
| Sincronización con el servidor | cada 3 s | `public/src/js/app.js` |

## 3.4 Estructura

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
    └── js/
        ├── alarm.js           lógica de alarma y audio
        └── app.js             mapa, panel e interacción
```

La carpeta `data/` se crea sola al ejecutar con JSON y está excluida del control de versiones.

## 3.5 API

Todas las rutas, salvo `/api/login`, requieren la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/login` | Crea la cuenta si no existe e inicia sesión. Cuerpo: `name`, `password`, `ruta` (2, 13 o 22). Devuelve `token` |
| GET | `/api/state` | Estado de paradas, buses activos y plan del usuario |
| POST | `/api/start` | Inicia el trayecto desde la Glorieta y asigna la primera parada |
| POST | `/api/arrive` | El chofer informa que llegó a su parada destino |
| POST | `/api/depart` | El chofer informa que salió. En la última parada termina el trayecto |
| POST | `/api/target` | Cambia el destino. Cuerpo: `stop` (parada posterior a la actual) |
| POST | `/api/logout` | Cierra la sesión y elimina el bus del usuario |

## 3.6 Seguridad

- El código del servidor y los datos quedan fuera de la carpeta pública.
- Política de seguridad de contenido (CSP) que solo permite scripts y estilos propios, sin código en línea.
- Cabeceras `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, entre otras.
- Contraseñas con `scrypt` y sal individual; comparación a tiempo constante.
- Límite de 10 intentos fallidos de login por IP cada 10 minutos.
- Sesiones por token con vencimiento de 12 horas y peticiones limitadas a 5 KB.

## 3.7 Despliegue en Render

1. Sube el repositorio a GitHub.
2. Crea un **Web Service** con build `npm install` y start `npm start`.
3. En *Environment* agrega `DATABASE_URL` (la Internal Database URL de tu Postgres) y, si quieres, `SKIP_PENALTY`. No definas `PORT`: Render lo asigna.

Sobre el plan gratuito de Render:

- El disco de un servicio gratuito es **efímero**: el JSON se pierde en cada reinicio, redeploy o suspensión (se suspende tras 15 minutos sin tráfico).
- El Postgres gratuito **expira a los 30 días** de creado (con 14 días de gracia). Para algo más duradero puedes usar un Postgres externo gratuito, como Neon, con la misma variable `DATABASE_URL`.
- Las condiciones del plan gratuito pueden cambiar. Confírmalas en la documentación de Render antes de desplegar.

## 3.8 Limitaciones conocidas

- No usa GPS: el sistema se entera de las llegadas y salidas porque el chofer las informa.
- El modelo de espera es una simplificación.
- Cualquier persona puede crear una cuenta; no hay un administrador que valide a los conductores.
- No hay recuperación de contraseña; hay que borrar el usuario manualmente en los datos.
- Una misma cuenta abierta en dos dispositivos controla el mismo bus.
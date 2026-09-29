# 🎮 Operation Impact

**Operation Impact** es un videojuego Web 3D en tercera persona desarrollado con **Three.js** y **Rapier 3D**.

El jugador controla a un agente SWAT dentro de un escenario táctico y debe localizar y destruir una serie de núcleos de energía antes de que termine el tiempo disponible.

El proyecto integra modelos 3D, animaciones, físicas, colisiones, cámara en tercera persona, disparos, granadas, objetos destructibles, misiones, puntuación, récords y una interfaz completa de juego.

---

# 🎯 Objetivo del videojuego

La misión principal consiste en localizar y destruir los **8 núcleos de energía** distribuidos dentro del escenario.

El jugador dispone de:

```text
2 minutos
```

para completar la misión.

Además, existe una **misión secundaria opcional** que consiste en destruir las diferentes figuras físicas generadas dentro del mapa.

El jugador puede utilizar:

- Rifle.
- Disparos.
- Granadas.
- Interacción física con los objetos.

---

# 📖 Historia

El jugador forma parte de una unidad especial enviada a una zona comprometida en la que se encuentran varios núcleos de energía.

Estos dispositivos deben ser destruidos antes de que termine el tiempo disponible.

Para completar la operación, el agente deberá recorrer el escenario, localizar los objetivos y utilizar su equipo para eliminarlos.

Además de los objetivos principales, existen diferentes estructuras y objetos físicos que pueden ser destruidos como parte de una misión secundaria.

---

# 🕹️ Reglas del juego

La partida comienza desde una pantalla inicial en la que el jugador puede conocer su misión y configurar algunos parámetros.

Una vez iniciada la misión:

- El jugador dispone de **2 minutos**.
- Debe destruir los **8 núcleos de energía**.
- Cada núcleo destruido aumenta la puntuación.
- Los objetos dinámicos pueden recibir impactos.
- Las figuras pueden ser destruidas mediante disparos.
- Las figuras también pueden ser destruidas mediante granadas.
- Las granadas afectan físicamente a los objetos cercanos.
- La potencia de las granadas puede configurarse entre **50 % y 200 %**.
- Existe una misión secundaria de destrucción de figuras.
- El HUD muestra el progreso constantemente.
- Si todos los núcleos son destruidos antes de terminar el tiempo, el jugador gana.
- Si el tiempo llega a cero, el jugador pierde.
- Después de ganar o perder es posible comenzar nuevamente la misión.

---

# 🏆 Condición de victoria

El jugador gana cuando destruye los:

```text
8 / 8 núcleos
```

antes de que termine el temporizador.

Al completar la misión se muestra una pantalla de victoria con información como:

- Objetivos destruidos.
- Puntuación.
- Tiempo utilizado.
- Récord del operador.

---

# ❌ Condición de derrota

La partida termina en derrota cuando el temporizador llega a:

```text
00:00
```

sin haber destruido todos los núcleos.

Después de la derrota el jugador puede:

```text
REINICIAR MISIÓN
```

o comenzar una:

```text
NUEVA PARTIDA
```

sin necesidad de recargar manualmente la página.

---

# 🎮 Controles

| Control | Acción |
|---|---|
| `W` | Avanzar |
| `A` | Moverse a la izquierda |
| `S` | Retroceder |
| `D` | Moverse a la derecha |
| `Shift` | Correr |
| Mouse | Mover la cámara |
| Rueda del mouse | Acercar o alejar cámara |
| Clic derecho | Apuntar |
| Clic izquierdo | Disparar |
| `R` | Recargar arma |
| `F` | Lanzar granada |
| `Esc` | Liberar el cursor |

---

# 🧍 Personaje

El videojuego utiliza un personaje SWAT en formato:

```text
GLB
```

El modelo se encuentra sincronizado con el sistema físico del jugador y cuenta con diferentes estados de animación.

Las animaciones utilizadas son:

```text
Idle
Walking
Run
Throw
```

El sistema selecciona automáticamente la animación correspondiente dependiendo de la acción que esté realizando el personaje.

---

# 🎬 Sistema de animaciones

Las animaciones son administradas mediante:

```text
THREE.AnimationMixer
```

El personaje puede cambiar entre diferentes estados sin necesidad de utilizar modelos independientes.

Los principales estados son:

```text
Idle
   ↓
Walking
   ↓
Run
   ↓
Throw
```

De esta forma, las acciones del jugador tienen una representación visual correspondiente.

---

# 🔫 Sistema de arma

El personaje utiliza un rifle 3D conectado a su mano derecha.

El módulo:

```text
weapon.js
```

es responsable de:

- Cargar el modelo del rifle.
- Buscar el hueso `RightHand`.
- Conectar el arma al personaje.
- Mantener la posición del rifle durante las animaciones.
- Mantener la orientación del arma.
- Calcular la posición real del cañón.

El rifle está conectado directamente al esqueleto del personaje, por lo que acompaña sus movimientos.

---

# 🔥 Muzzle real

El sistema de arma cuenta con un punto llamado:

```text
WeaponMuzzle
```

que representa la salida real del cañón.

Los proyectiles y efectos del disparo utilizan este punto como posición inicial.

Esto permite que el disparo visual salga directamente desde el arma y no desde una posición simulada frente al personaje.

---

# 🔫 Sistema de disparos

El sistema de disparo incluye:

- Apuntado.
- Disparo.
- Proyectil visual.
- Muzzle flash.
- Efectos de impacto.
- Hitmarker.
- Retroceso de cámara.
- Daño a objetivos.
- Daño a figuras.
- Munición.
- Recarga.

La dirección del disparo se obtiene mediante la cámara y el crosshair.

El proyectil visual comienza desde la posición real del cañón del rifle.

---

# 🔢 Munición

El arma cuenta con:

```text
30 proyectiles por cargador
```

y una reserva inicial de:

```text
90 proyectiles
```

Cuando el cargador se vacía, el jugador puede presionar:

```text
R
```

para recargar.

---

# 💣 Sistema de granadas

El personaje también puede lanzar granadas utilizando:

```text
F
```

Las granadas cuentan con un cuerpo físico generado con **Rapier 3D**.

Por esta razón pueden:

- Caer por gravedad.
- Rebotar.
- Chocar contra el escenario.
- Rodar.
- Interactuar con objetos físicos.

Después de unos segundos la granada explota.

---

# 💥 Explosiones

Las explosiones generan:

- Fuerza radial.
- Impulso sobre objetos.
- Movimiento vertical.
- Rotación.
- Daño.
- Partículas.
- Bola de fuego.
- Humo.
- Onda expansiva.
- Luz temporal.

La fuerza disminuye dependiendo de la distancia entre el objeto y el centro de la explosión.

---

# 🎚️ Potencia configurable de granadas

El juego cuenta con un parámetro configurable que permite modificar la potencia de las granadas.

El rango disponible es:

```text
50 % ───────── 100 % ───────── 200 %
```

Este parámetro modifica realmente:

```text
Fuerza de explosión
+
Impulso físico
+
Daño producido
```

Por ejemplo:

```text
50 %
Menor fuerza y menor daño

100 %
Potencia normal

200 %
Mayor fuerza y mayor daño
```

El control está disponible tanto antes de comenzar la misión como durante la partida.

---

# 🧱 Objetos físicos

Durante la ejecución del juego se generan diferentes figuras tridimensionales.

Entre ellas existen:

```text
Cajas
Esferas
Cilindros
Conos
Bloques
```

Estas figuras utilizan cuerpos rígidos dinámicos de Rapier.

Por lo tanto pueden:

- Caer.
- Girar.
- Chocar.
- Ser empujadas.
- Recibir impactos.
- Recibir explosiones.
- Recibir daño.
- Ser destruidas.

---

# ❤️ Sistema de vida de objetos

Las figuras destructibles cuentan inicialmente con:

```text
100 HP
```

Los disparos y las granadas reducen su vida.

Cuando la vida llega a:

```text
0 HP
```

el objeto es considerado destruido y se elimina de la zona jugable.

---

# 🏗️ Estructura derribable

El escenario también contiene una estructura formada por varios objetos físicos.

Cada pieza utiliza un cuerpo rígido independiente.

Esto permite derribar la estructura mediante:

- Colisiones.
- Disparos.
- Granadas.
- Explosiones.
- Interacciones físicas.

---

# ⚡ Núcleos de energía

Dentro del escenario existen:

```text
8 núcleos
```

que forman parte de la misión principal.

Los núcleos pueden recibir daño mediante:

```text
Disparos
Granadas
```

Cuando un núcleo es destruido:

- desaparece del escenario;
- aumenta el contador de objetivos;
- aumenta la puntuación;
- actualiza el HUD.

---

# 🎯 Misión principal

El HUD muestra:

```text
MISIÓN PRINCIPAL

NÚCLEOS
0 / 8
```

El jugador debe completar:

```text
8 / 8
```

para ganar.

---

# 🎯 Misión secundaria

Además de los núcleos existe una misión secundaria.

Consiste en destruir las figuras dinámicas distribuidas por el escenario.

El HUD muestra:

```text
MISIÓN SECUNDARIA

FIGURAS
X / TOTAL
```

Esta misión es opcional.

Por lo tanto, no es necesario destruir todas las figuras para completar la misión principal.

---

# ⏱️ Temporizador

Cada partida comienza con:

```text
02:00
```

El tiempo restante aparece en la parte superior derecha de la pantalla.

Cuando queda poco tiempo, el temporizador cambia visualmente para advertir al jugador.

Durante los últimos segundos entra en un estado crítico.

---

# ⭐ Sistema de puntuación

El jugador recibe puntos al destruir los objetivos principales.

Cada núcleo destruido proporciona:

```text
500 puntos
```

Por lo tanto, la puntuación máxima obtenida mediante los objetivos principales es:

```text
4000 puntos
```

---

# 🏅 Sistema de récords

Operation Impact incorpora un sistema de récords.

Antes de iniciar una partida el jugador puede introducir el nombre de su operador.

Cuando completa la misión, se calcula el tiempo utilizado.

Los mejores tiempos se almacenan mediante:

```javascript
localStorage
```

El sistema conserva los mejores registros y los ordena desde el menor tiempo hasta el mayor.

Los récords son locales al:

```text
Navegador
+
Dispositivo
```

por lo que actualmente no utilizan una base de datos remota.

---

# 🔄 Reinicio de misión

El juego permite reiniciar la misión sin cerrar el navegador.

Cuando se reinicia se restauran:

```text
Jugador
Posición inicial
Temporizador
Puntuación
Objetivos
Figuras
Granadas
Munición
Animaciones
Cámara
Estado del juego
```

De esta forma la partida vuelve a sus condiciones iniciales.

---

# 🆕 Nueva partida

También existe la opción:

```text
NUEVA PARTIDA
```

que permite regresar a la pantalla principal.

Los récords almacenados mediante `localStorage` se conservan.

---

# 📷 Cámara

El videojuego utiliza una cámara en tercera persona.

La cámara incorpora:

- Seguimiento del personaje.
- Movimiento mediante mouse.
- Pointer Lock.
- Zoom.
- Cámara de hombro.
- Apuntado.
- Retroceso durante los disparos.

Cuando el jugador apunta, la cámara se desplaza para ofrecer una vista más cercana sobre el hombro.

---

# 🎯 Crosshair

En el centro de la pantalla existe un crosshair utilizado como referencia para apuntar.

El sistema de disparo utiliza la dirección de la cámara para determinar hacia dónde debe viajar el proyectil.

---

# ⚙️ Sistema de física

La física se implementó mediante:

```text
Rapier 3D
```

Rapier administra:

- Gravedad.
- Colliders.
- Rigid Bodies.
- Colisiones.
- Impulsos.
- Objetos dinámicos.
- Granadas.
- Explosiones.
- Movimiento del personaje.

---

# 🧍 Física del personaje

El jugador utiliza un cuerpo:

```text
kinematicPositionBased
```

con un collider:

```text
Capsule
```

Esto permite controlar directamente el movimiento del personaje mientras Rapier se encarga de detectar las colisiones.

El personaje puede desplazarse por el escenario sin atravesar los obstáculos configurados como sólidos.

---

# 🌎 Física del escenario

El escenario utiliza colliders estáticos.

Los pisos, paredes y obstáculos principales forman parte de la simulación física.

Esto evita que el personaje atraviese la geometría principal del mapa.

---

# 🛡️ Protección contra atravesamientos

Los objetos rápidos y las granadas utilizan mecanismos para reducir problemas de atravesamiento de colliders.

Esto ayuda a mantener una simulación más estable durante impactos y movimientos rápidos.

---

# 🖥️ Interfaz de usuario

La interfaz fue desarrollada utilizando:

```text
HTML
CSS
JavaScript
Bootstrap 5
```

El HUD muestra información importante de la partida.

Entre sus elementos se encuentran:

```text
Estado de la misión
Núcleos destruidos
Figuras destruidas
Puntuación
Tiempo restante
Munición
Potencia de granadas
Controles
Récords
```

---

# 🛠️ Tecnologías utilizadas

El proyecto utiliza las siguientes tecnologías:

```text
HTML5
CSS3
JavaScript ES Modules
Three.js
GLTFLoader
OrbitControls
AnimationMixer
Rapier 3D
Bootstrap 5
Git
GitHub
GitHub Pages
GLB / glTF
```

La versión utilizada de Three.js es:

```text
0.186.0
```

---

# 📁 Estructura del proyecto

```text
threejs-video-game-exam/
│
├── index.html
├── README.md
│
└── assets/
    │
    ├── css/
    │   └── styles.css
    │
    ├── js/
    │   ├── main.js
    │   ├── game.js
    │   ├── physics.js
    │   ├── ui.js
    │   ├── objects.js
    │   ├── grenades.js
    │   ├── objectives.js
    │   ├── shooting.js
    │   └── weapon.js
    │
    └── models/
        │
        ├── environment/
        │   └── warfacemap.glb
        │
        ├── character/
        │   ├── Swat.glb
        │   ├── Idle.glb
        │   ├── walking.glb
        │   ├── run.glb
        │   └── throw.glb
        │
        └── props/
            └── weapon.glb
```

---

# 🧩 Organización del código

## `main.js`

Es el archivo principal del videojuego.

Administra:

```text
Escena
Renderer
Cámara
Personaje
Animaciones
Controles
Movimiento
Apuntado
Entradas del teclado
Entradas del mouse
Loop principal
```

---

## `physics.js`

Administra:

```text
Rapier
Gravedad
Colliders
Personaje físico
Colisiones
Movimiento cinemático
```

---

## `game.js`

Administra las reglas generales del videojuego:

```text
INICIO
JUGANDO
VICTORIA
DERROTA
```

Además controla:

```text
Puntuación
Temporizador
Objetivos destruidos
```

---

## `objects.js`

Administra los objetos dinámicos.

Incluye:

```text
Generación de figuras
Rigid Bodies
Colliders
Vida
Daño
Destrucción
Estructura derribable
Reset
```

---

## `grenades.js`

Controla:

```text
Creación de granadas
Lanzamiento
Física
Fusible
Explosión
Daño
Impulso
Potencia configurable
Efectos visuales
```

---

## `objectives.js`

Administra los núcleos de energía.

Controla:

```text
Vida
Daño
Destrucción
Reset
Estado de objetivos
```

---

## `shooting.js`

Administra:

```text
Apuntado
Disparos
Proyectiles
Muzzle Flash
Munición
Recarga
Retroceso
Hitmarker
Daño
Impactos
```

---

## `weapon.js`

Administra el rifle 3D.

Se encarga de:

```text
Cargar weapon.glb
Buscar RightHand
Conectar el arma
Ajustar posición
Ajustar rotación
Calcular el muzzle
```

---

## `ui.js`

Administra la interfaz del videojuego.

Incluye:

```text
HUD
Temporizador
Puntuación
Objetivos
Misión secundaria
Potencia de granadas
Victoria
Derrota
Reinicio
Nueva partida
Récords
```

---

# ▶️ Ejecución local

Debido al uso de módulos ES6 y modelos externos, el proyecto debe ejecutarse mediante un servidor local.

Una opción sencilla es utilizar:

```text
Visual Studio Code
+
Live Server
```

Pasos:

```text
1. Descargar o clonar el repositorio.

2. Abrir la carpeta del proyecto en Visual Studio Code.

3. Instalar la extensión Live Server.

4. Abrir index.html.

5. Seleccionar:

   Open with Live Server

6. Esperar a que carguen:
   - escenario
   - personaje
   - animaciones
   - arma
   - física

7. Presionar:

   INICIAR MISIÓN
```

No se recomienda abrir `index.html` directamente mediante:

```text
file://
```

---

# 🌐 GitHub Pages

El videojuego está preparado para utilizar rutas relativas y publicarse mediante:

```text
GitHub Pages
```

## Repositorio

Agregar aquí la URL final:

```text
AGREGAR_AQUI_URL_DEL_REPOSITORIO
```

## Aplicación

Agregar aquí la URL de GitHub Pages:

```text
AGREGAR_AQUI_URL_DE_GITHUB_PAGES
```

---

# 🧪 Pruebas realizadas

Durante el desarrollo se realizaron diferentes pruebas para verificar el funcionamiento del videojuego.

Se comprobó:

```text
✅ Carga del escenario
✅ Carga del personaje
✅ Animación Idle
✅ Animación Walking
✅ Animación Run
✅ Animación Throw
✅ Movimiento WASD
✅ Carrera con Shift
✅ Cámara en tercera persona
✅ Movimiento del mouse
✅ Zoom
✅ Pointer Lock
✅ Física del personaje
✅ Colisiones
✅ Objetos dinámicos
✅ Estructura derribable
✅ Apuntado
✅ Disparos
✅ Muzzle real
✅ Impactos
✅ Daño a figuras
✅ Daño a núcleos
✅ Munición
✅ Recarga
✅ Granadas
✅ Física de granadas
✅ Explosiones
✅ Potencia configurable
✅ Daño de granadas a figuras
✅ Destrucción de objetivos
✅ Misión secundaria
✅ Temporizador
✅ Puntuación
✅ Victoria
✅ Derrota
✅ Reinicio
✅ Nueva partida
✅ Récords
```

---

# 📌 Historial de desarrollo

El proyecto se desarrolló progresivamente utilizando Git.

Las funcionalidades se incorporaron en diferentes etapas para evitar modificar demasiados sistemas al mismo tiempo.

Entre las principales etapas se encuentran:

```text
Escena inicial
        ↓
Personaje
        ↓
Animaciones
        ↓
Movimiento
        ↓
Física
        ↓
Escenario personalizado
        ↓
Granadas
        ↓
Objetivos
        ↓
Temporizador
        ↓
Sistema de disparos
        ↓
Objetos destructibles
        ↓
Cámara TPS
        ↓
Apuntado
        ↓
Munición
        ↓
Recarga
        ↓
Arma 3D
        ↓
Muzzle real
        ↓
Victoria y derrota
        ↓
Reinicio
        ↓
Potencia configurable
        ↓
HUD avanzado
        ↓
Misión secundaria
        ↓
Récords
        ↓
Daño de granadas
        ↓
Versión final
```

---

# 🤖 Uso de inteligencia artificial

Durante el desarrollo del proyecto se utilizó inteligencia artificial como herramienta de apoyo para revisar código, encontrar errores y proponer posibles soluciones.

Entre los problemas trabajados con apoyo de IA se encuentran:

```text
Organización modular
Integración de Rapier
Colisiones
Carga de modelos
Conversión de modelos
Animaciones
Cámara
Sistema de disparos
Posición del arma
Muzzle real
Munición
Recarga
Granadas
Explosiones
Objetos destructibles
HUD
Victoria
Derrota
Reinicio
Potencia configurable
Misión secundaria
Récords
```

Las propuestas realizadas con apoyo de IA fueron probadas antes de incorporarse definitivamente.

También se realizaron ajustes manuales en:

```text
Escalas
Posiciones
Rotaciones
Velocidades
Fuerzas
Rutas
Colliders
Cámara
Interfaz
Daño
Controles
```

Esto permitió conservar las funciones que ya estaban trabajando correctamente mientras se incorporaban nuevas mejoras.

La inteligencia artificial se utilizó como asistente de programación y no sustituyó las pruebas, correcciones ni decisiones realizadas durante el desarrollo.

---

# 🎨 Créditos

Los modelos y recursos externos conservan los derechos y licencias establecidos por sus respectivos autores.

---

## 🔫 Rifle

### RM-277 Weapon tirator

**Autor:** RC-3106

**Plataforma:** Sketchfab

**URL:**

https://sketchfab.com/3d-models/rm-277-weapon-tirator-2356511cb29d45d480cf74aeb16c186c

**Licencia:**

```text
Creative Commons Attribution 4.0
CC BY 4.0
```

El modelo fue adaptado para integrarlo al personaje y al sistema de disparos de Operation Impact.

---

## 🧍 Personaje SWAT

Completar con la información de la fuente original:

```text
Modelo:
Autor:
Plataforma:
URL:
Licencia:
```

---

## 🌎 Escenario

Completar con la información de la fuente original del escenario utilizado:

```text
Modelo:
Autor:
Plataforma:
URL:
Licencia:
```

---

## 🎬 Animaciones

Completar con la fuente original de:

```text
Idle
Walking
Run
Throw
```

Información requerida:

```text
Autor:
Plataforma:
URL:
Licencia:
```

> No se deben inventar autores o licencias. Se recomienda colocar exactamente la información proporcionada por la plataforma desde la cual fueron obtenidos los recursos.

---

# 💡 Conclusión

Durante el desarrollo de **Operation Impact** se logró construir un videojuego Web 3D funcional integrando diferentes tecnologías como Three.js, Rapier 3D, modelos GLB, animaciones, físicas, colisiones e interacción con objetos.

A lo largo del proyecto se fueron agregando de manera progresiva elementos como el movimiento del personaje, cámara en tercera persona, disparos, recarga, granadas, objetos destructibles, objetivos principales y secundarios, puntuación, victoria, derrota, reinicio, potencia configurable y un sistema de récords.

Uno de los principales retos fue conseguir que todas estas mecánicas trabajaran juntas sin afectar las funciones que ya se encontraban estables. Por esta razón, los cambios se realizaron poco a poco y se probaron después de cada modificación.

También se logró mejorar la interacción física haciendo que los disparos y las granadas puedan afectar a los objetos del escenario. La potencia de las granadas no solamente modifica un elemento visual, sino que cambia realmente la fuerza y el daño de las explosiones.

Otro aspecto importante fue la integración del rifle 3D con el personaje, manteniendo el sistema de animaciones, cámara y disparos existente. Se incorporó además un punto de salida real del cañón para mejorar visualmente el origen de los proyectiles.

Finalmente, el proyecto cuenta con una misión principal clara, una misión secundaria, progreso, temporizador, puntuación, récords, condiciones de victoria y derrota y diferentes opciones para reiniciar la experiencia.

El desarrollo de este videojuego permitió comprender mejor cómo se pueden combinar renderizado 3D, animaciones, físicas y lógica de programación dentro de una aplicación Web interactiva.

Como mejoras futuras se podrían agregar enemigos controlados por inteligencia artificial, diferentes armas, más escenarios, nuevos tipos de misiones y un sistema de récords conectado a una base de datos para compartir resultados entre diferentes jugadores.

---

# 👤 Autor

```text
Nombre: AGREGAR_NOMBRE
Carrera: Tecnologías de la Información y Comunicaciones
Materia: AGREGAR_MATERIA
```

---

# 📄 Licencia

Este proyecto fue desarrollado con fines académicos.

Los modelos, animaciones y demás recursos externos utilizados conservan las licencias y condiciones establecidas por sus respectivos autores.

---

# 🎮 Operation Impact

```text
Localiza.
Apunta.
Destruye.
Completa la misión.
```
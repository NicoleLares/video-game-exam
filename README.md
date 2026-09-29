🎮 Operation Impact
Operation Impact es un videojuego Web 3D en tercera persona desarrollado con Three.js y Rapier 3D. El jugador controla a un agente SWAT dentro de un escenario táctico y debe destruir los núcleos de energía antes de que termine el tiempo.
Además de la misión principal, el escenario incluye objetos físicos destructibles, una misión secundaria opcional, disparos, granadas, recarga de arma, cámara en tercera persona, físicas, colisiones, puntuación, récords y un parámetro configurable que modifica el comportamiento real de las explosiones.
🎯 Objetivo de la misión
La misión principal consiste en localizar y destruir los 8 núcleos de energía distribuidos en el escenario antes de que el temporizador llegue a cero.
Durante la partida también existe una misión secundaria opcional que consiste en destruir las figuras físicas generadas dentro del mapa.
El jugador puede utilizar su rifle y granadas para interactuar con los elementos del escenario.
🕹️ Reglas del juego
- La partida comienza desde la pantalla inicial.
- El jugador dispone de 2 minutos para completar la misión principal.
- Es necesario destruir los 8 núcleos de energía para ganar.
- Cada núcleo destruido aumenta la puntuación.
- Las figuras físicas pueden recibir daño mediante disparos y granadas.
- La destrucción de figuras forma parte de una misión secundaria opcional.
- Las granadas producen daño y fuerza física según la distancia de la explosión.
- La potencia de las granadas puede modificarse entre 50 % y 200 %.
- Si el tiempo llega a cero antes de destruir todos los núcleos, la misión termina en derrota.
- Después de una victoria o derrota es posible reiniciar la misión o comenzar una nueva partida.
- Los mejores tiempos se almacenan localmente en el navegador.
🏆 Condiciones de victoria y derrota
Victoria
El jugador gana cuando destruye los 8 núcleos de energía antes de que termine el tiempo disponible.
Al completar la misión se muestra una pantalla de victoria con objetivos destruidos, puntuación, tiempo restante y registro del mejor tiempo del operador.
Derrota
El jugador pierde si el temporizador llega a 00:00 antes de destruir todos los núcleos.
La pantalla de derrota permite volver a intentar la misión o regresar al menú para comenzar una nueva partida.
🎮 Controles
Control	Acción
W	Avanzar
A	Moverse a la izquierda
S	Retroceder
D	Moverse a la derecha
Shift	Correr
Mouse	Controlar la cámara
Rueda del mouse	Zoom de cámara
Clic derecho	Apuntar
Clic izquierdo	Disparar
R	Recargar
F	Lanzar granada
Esc	Liberar el cursor


🔫 Sistema de combate
El personaje utiliza un rifle 3D unido al hueso de la mano derecha del modelo.
El sistema de disparo incluye:
- apuntado desde el centro de la pantalla;
- proyectil visual;
- salida del disparo desde el cañón real del arma;
- fogonazo de disparo;
- efectos de impacto;
- hitmarker;
- retroceso de cámara;
- daño a núcleos;
- daño a figuras dinámicas;
- cargador y munición de reserva;
- sistema de recarga.
El rifle utiliza un cargador de 30 proyectiles y una reserva inicial de 90 proyectiles.
💣 Sistema de granadas
Las granadas utilizan cuerpos rígidos de Rapier 3D, por lo que responden a gravedad, colisiones y rebotes.
Cuando una granada explota:
- afecta físicamente a los objetos cercanos;
- aplica impulso y rotación;
- causa daño a las figuras destructibles;
- puede destruir núcleos dentro del radio de explosión;
- genera partículas, humo, luz y onda expansiva.
La potencia puede ajustarse desde la interfaz entre:
- 50 % — menor fuerza y daño;
- 100 % — comportamiento normal;
- 200 % — mayor fuerza y daño.
Este parámetro modifica realmente la simulación del juego y no únicamente la apariencia visual.
🧱 Objetos físicos y destrucción
El escenario contiene diferentes objetos dinámicos creados durante la ejecución, entre ellos:
- cajas;
- esferas;
- cilindros;
- conos;
- bloques de una estructura derribable.
Los objetos cuentan con cuerpos rígidos dinámicos, colliders, masa y densidad, fricción, gravedad, límite de velocidad, detección continua de colisiones, vida, daño visual progresivo y destrucción.
Las figuras cuentan con 100 puntos de vida y pueden ser destruidas mediante disparos o explosiones.
⚡ Objetivos principales
Dentro del mapa existen 8 núcleos de energía.
Cada núcleo puede recibir daño, reaccionar visualmente a los impactos, ser destruido mediante disparos o granadas, actualizar el HUD al ser eliminado y aumentar la puntuación del jugador.
La destrucción de los ocho núcleos activa la condición de victoria.
🎯 Misión secundaria
La misión secundaria consiste en destruir las figuras dinámicas distribuidas por el escenario.
El HUD muestra:
MISIÓN SECUNDARIA
FIGURAS   X / TOTAL
Esta misión es opcional y no impide completar la misión principal.
⏱️ Temporizador
Cada partida inicia con:
02:00
El tiempo restante se muestra en la esquina superior derecha.
El temporizador cambia visualmente cuando queda poco tiempo y entra en estado crítico durante los últimos segundos.
🏅 Sistema de récords
Operation Impact incluye un sistema de récords basado en el mejor tiempo empleado para destruir todos los núcleos.
Antes de iniciar una partida, el jugador puede introducir el nombre de su operador.
Los mejores resultados se almacenan mediante:
localStorage
Se conservan los mejores tiempos en el navegador actual.
Los récords son locales al dispositivo y navegador. No utilizan una base de datos remota.

🖥️ Interfaz
La interfaz incluye pantalla inicial, instrucciones de misión, nombre del operador, HUD de estado, contador de núcleos, misión secundaria, puntuación, temporizador, munición, información de objetivos, potencia de granada, controles, botones de reinicio y nueva partida, pantalla de victoria, pantalla de derrota y tabla de récords.
🎬 Animaciones
El personaje utiliza AnimationMixer de Three.js para administrar diferentes estados de animación.
Las animaciones principales utilizadas son:
- Idle
- Walking
- Run
- Throw
📷 Cámara
El juego utiliza una cámara en tercera persona con seguimiento del personaje.
Incluye movimiento mediante mouse, Pointer Lock durante la partida, cámara de hombro al apuntar, zoom, seguimiento del jugador y retroceso al disparar.
⚙️ Sistema de física
La física se implementó con Rapier 3D.
El sistema administra gravedad, colliders estáticos, cuerpos rígidos dinámicos, personaje cinemático, colisiones con el escenario, objetos destructibles, impulsos de disparos, explosiones, lanzamiento de granadas, límites de velocidad y protección contra atravesamientos a altas velocidades.
El personaje utiliza un collider tipo cápsula para desplazarse dentro del escenario sin atravesar las superficies configuradas como sólidas.
🛠️ Tecnologías utilizadas
- HTML5
- CSS3
- JavaScript ES Modules
- Three.js 0.186
- GLTFLoader
- OrbitControls
- AnimationMixer
- Rapier 3D
- Bootstrap 5
- Git
- GitHub
- GitHub Pages
- Modelos 3D GLB / glTF
📁 Estructura general
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
🧩 Organización del código
main.js
Controla la inicialización general, personaje, cámara, movimiento, entrada del usuario y ciclo principal del juego.
physics.js
Administra Rapier 3D, gravedad, colliders y movimiento físico del personaje.
game.js
Contiene los estados de la partida, puntuación, temporizador y condiciones de victoria y derrota.
objects.js
Genera y administra figuras dinámicas, daño, destrucción y estructura derribable.
grenades.js
Controla lanzamiento, trayectoria, explosión, daño y potencia de las granadas.
objectives.js
Administra los núcleos de energía y su estado.
shooting.js
Controla apuntado, disparos, munición, recarga, impactos y efectos.
weapon.js
Carga el rifle 3D, lo conecta con la mano derecha del personaje y proporciona la posición real del cañón.
ui.js
Administra el HUD, temporizador, misión secundaria, potencia de granada, victoria, derrota y récords.
▶️ Ejecución local
Debido al uso de módulos ES6 y modelos externos, el proyecto debe ejecutarse mediante un servidor local.
Una opción sencilla es utilizar Visual Studio Code + Live Server.
1. Clonar o descargar el proyecto.
2. Abrir la carpeta en Visual Studio Code.
3. Instalar la extensión Live Server.
4. Abrir index.html.
5. Seleccionar Open with Live Server.
6. Esperar a que se carguen el escenario, personaje, animaciones y físicas.
7. Presionar INICIAR MISIÓN.
No se recomienda abrir index.html directamente con file://.
🌐 Publicación
El proyecto está diseñado para publicarse mediante GitHub Pages utilizando rutas relativas.
Repositorio
AGREGAR_AQUI_URL_DEL_REPOSITORIO
GitHub Pages
AGREGAR_AQUI_URL_DE_GITHUB_PAGES
Antes de entregar se recomienda comprobar que el repositorio sea público, que GitHub Pages cargue correctamente, que los modelos GLB aparezcan y que no existan errores críticos o recursos 404 en F12 > Console / Network.
🤖 Uso de inteligencia artificial
Durante el desarrollo se utilizó inteligencia artificial como apoyo para revisar código, identificar errores y proponer soluciones.
Entre los problemas trabajados con apoyo de IA se encuentran:
- organización modular del proyecto;
- integración de Rapier 3D;
- corrección de colisiones;
- posicionamiento del personaje;
- integración de modelos GLB;
- sistema de disparos;
- colocación del arma en la mano del personaje;
- detección del punto del cañón;
- sistema de granadas;
- daño de objetos;
- HUD;
- condiciones de victoria y derrota;
- reinicio de partidas;
- misión secundaria;
- potencia configurable;
- sistema de récords.
Las soluciones propuestas fueron probadas durante el desarrollo y se realizaron ajustes manuales en posiciones, escalas, rutas, valores físicos, interfaz, controles y comportamiento de las mecánicas hasta obtener el resultado final.
El uso de IA funcionó como herramienta de apoyo y no sustituyó las pruebas ni las decisiones realizadas durante el desarrollo.
🧪 Pruebas realizadas
Durante el desarrollo se comprobaron:
- carga correcta del escenario;
- carga del personaje;
- reproducción de animaciones;
- movimiento con WASD;
- carrera con Shift;
- seguimiento de cámara;
- zoom;
- Pointer Lock;
- colisiones con el escenario;
- interacción con figuras físicas;
- disparos;
- daño a núcleos;
- daño a figuras;
- munición y recarga;
- lanzamiento de granadas;
- potencia configurable;
- daño de granadas;
- destrucción de objetos;
- victoria;
- derrota;
- reinicio;
- nueva partida;
- actualización del HUD;
- guardado de récords.
📌 Historial de desarrollo
El proyecto se desarrolló de forma progresiva mediante Git y GitHub, incorporando funcionalidades y correcciones en diferentes versiones.
Entre las etapas principales se encuentran:
- estructura inicial y escena 3D;
- personaje y animaciones;
- física y colisiones;
- escenario personalizado;
- granadas;
- objetivos y reglas del juego;
- sistema de disparos;
- figuras destructibles;
- apuntado y cámara;
- munición y recarga;
- arma 3D y muzzle real;
- victoria, derrota y reinicio;
- potencia configurable;
- HUD avanzado;
- misión secundaria;
- récords;
- daño de granadas a figuras.
🎨 Créditos y recursos externos
Los recursos externos utilizados en el proyecto deben conservar la atribución indicada por sus autores.
Rifle
RM-277 Weapon tirator
- Autor: RC-3106
- Plataforma: Sketchfab
- URL: https://sketchfab.com/3d-models/rm-277-weapon-tirator-2356511cb29d45d480cf74aeb16c186c
- Licencia: CC BY 4.0
Personaje SWAT
Completar con la fuente original del modelo utilizado:
Autor:
URL:
Licencia:
Escenario
Completar con la fuente original del escenario Warface utilizado:
Autor:
URL:
Licencia:
Animaciones
Completar con la fuente original de las animaciones Idle, Walking, Run y Throw:
Autor:
URL:
Licencia:
Es importante completar estos datos con la fuente real de cada recurso antes de la entrega. No se deben inventar autores ni licencias.

💡 Conclusión
Durante el desarrollo de Operation Impact se logró integrar en un mismo proyecto diferentes elementos trabajados durante el tema, como modelos 3D, animaciones, cámara en tercera persona, controles, físicas, colisiones, objetos dinámicos, disparos, granadas y una interfaz de juego completa.
Uno de los principales retos fue lograr que todas las mecánicas funcionaran en conjunto sin afectar funcionalidades que ya habían sido implementadas. Por esta razón, muchas mejoras se realizaron de manera progresiva, modificando únicamente los módulos necesarios y realizando pruebas después de cada cambio.
También se mejoró la interacción física haciendo que tanto los disparos como las granadas pudieran afectar y destruir objetos del escenario. La potencia de las granadas se convirtió en un parámetro configurable que modifica realmente el daño y la fuerza de la explosión.
Finalmente, el proyecto cuenta con una misión principal, una misión secundaria, puntuación, temporizador, récords, estados de victoria y derrota y opciones de reinicio. El desarrollo permitió comprender mejor la relación entre Three.js, Rapier 3D, animaciones, física y lógica de juego, además de la importancia de probar cada cambio antes de integrarlo de manera definitiva.
Como mejora futura se podrían agregar enemigos controlados por inteligencia artificial, diferentes armas, más niveles, nuevos tipos de objetivos y un sistema de récords conectado a una base de datos para compartir resultados entre distintos jugadores.
👤 Autor
Nombre: AGREGAR_NOMBRE
Carrera: Tecnologías de la Información y Comunicaciones
Materia: AGREGAR_MATERIA
📄 Licencia
Este proyecto fue desarrollado con fines académicos.
Los modelos, animaciones y recursos externos conservan las licencias establecidas por sus respectivos autores.
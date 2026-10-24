# Rutinas de limpieza con temporizador y voz

## Objetivo
App para agilizar la limpieza: una rutina de acciones encadenadas con temporizador,
que arranca con un botón de Play y te va guiando por voz para hacer cada tarea lo
más rápido posible.

## Pantalla principal
- Un botón grande de Play centrado en la parte inferior (o al centro). Al presionarlo arranca la rutina seleccionada.
- Se muestra la acción actual y un temporizador en cuenta regresiva con el tiempo que queda para esa acción.
- Cuando termina una acción, la siguiente arranca automáticamente (sin tener que tocar nada).

## Acciones y listas
- Una rutina/lista es un conjunto ordenado de acciones. Cada acción tiene: nombre y duración (su propio temporizador).
- Ejemplo de lista 'Baño': limpiar la taza, limpiar la ducha, limpiar el lavamanos, ponerle CIF al inodoro, aromatizar, limpiar el piso.
- El usuario puede editar todo: nombre de la lista, agregar/quitar/reordenar acciones, editar nombre y duración de cada acción, y crear varias listas.

## Voz
- Al empezar una acción, una voz dice: 'Empezando <nombre de la acción>'.
- Cuando la acción actual está por terminar, la voz dice: 'Terminando <nombre de la acción>'.

## Auto-actualización desde GitHub
- La app debe chequear si hay una versión nueva en el repositorio de GitHub y actualizarse automáticamente, para no tener que reinstalarla a mano desde la computadora.
- Flujo: Claude Code hace los cambios pedidos en el repo, commitea y pushea a GitHub; la app detecta la nueva release y el usuario la descarga desde ahí.

## Notas de implementación
- Plataforma sugerida: app Android. Definir stack. Auto-update posible vía GitHub Releases (comparar versión instalada vs última release y bajar el APK).
- Prioridad UX: mínima fricción; darle Play y que la rutina corra sola con guía por voz y temporizadores encadenados.

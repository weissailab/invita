# Invita 💌

Invitaciones digitales que se abren como un sobre y se confirman por WhatsApp.
Bodas, quince, cumpleaños, grados, baby showers, bautizos y eventos de empresa.

**En vivo:** https://invita.weissailab.com/
**Ejemplo:** https://invita.weissailab.com/#/ejemplo

Hecho por [Weiss AI Lab](https://weissailab.com).

---

## Qué hace

El anfitrión llena los datos de su evento y le queda un link. Cada invitado que
lo abre ve un sobre lacrado **con su nombre encima**, lo toca, el sobre se abre
y aparece la invitación: cuenta regresiva en vivo, cómo llegar, programa del
día, código de vestuario, lluvia de sobres y un botón grande de **confirmar
asistencia** que abre WhatsApp con el mensaje ya escrito.

Lo que lo hace distinto de mandar una imagen por WhatsApp:

- **Un link por invitado.** En la pantalla final se pega la lista de invitados
  (uno por línea, con el celular después de una coma si se tiene) y salen los
  links personalizados, cada uno con su botón de "Enviar".
- **La confirmación llega a WhatsApp, no a un formulario.** Le llega al
  anfitrión "Soy María Fernanda. Vamos 3 personas." y ya. Sin cuentas, sin
  planillas, sin que nadie tenga que instalar nada.
- **La cuenta regresiva y el "cómo llegar" funcionan de verdad** en el celular.

## La decisión de diseño que hay que respetar

**La invitación viaja dentro del link.** Se comprime con LZ-string y va en el
fragmento (`#/i/…`), que nunca llega al servidor. No hay backend, ni base de
datos, ni cuentas, ni cookies. Operarlo cuesta cero para siempre y no guarda
datos de nadie — ni del anfitrión, ni de los invitados.

La contrapartida: **quien pierde su link de edición pierde la invitación.** Por
eso la pantalla final insiste en mandárselo a uno mismo por WhatsApp.

La otra contrapartida es la foto. Como también viaja en el link, se comprime
hasta caber en un presupuesto (`TOPE_FOTO`) y el editor muestra un medidor en
verde/ámbar/rojo. Sin foto una invitación pesa ~900 caracteres, que es un link
normal; con foto se pasa de los 20.000 y WhatsApp empieza a verse feo. Es una
tensión de producto, no un bug: se avisa de frente y el anfitrión decide.

## Cómo está armado

Sin build. Cuatro archivos y a correr.

```
index.html      metadatos y og:image (lo que ve el invitado en la vista previa)
app.css         el laboratorio (landing + editor) y la invitación, con temas
app.js          modelo, ruteo por hash, editor y la invitación
vendor/         lz-string
og.png          tarjeta de vista previa, generada con herramientas/og.mjs
```

- **Rutas:** `#/crear` (editor), `#/listo` (publicación), `#/i/<datos>` y
  `#/i/<datos>/p/<nombre>` (invitación), `#/e/<datos>` (volver a editar),
  `#/ejemplo`.
- **Temas** (`TEMAS` en `app.js` + bloques `.inv[data-tema=…]` en `app.css`):
  clásico, noche, botánico, fiesta, bebé y tinta. Un tema nuevo es un bloque de
  variables CSS y una entrada en el objeto; nada más.
- **Tipos de evento** (`TIPOS`): cada uno trae su rótulo, su sello de lacre, su
  frase por defecto y cómo se nombra el evento en los mensajes de WhatsApp
  ("a la boda de…", "a los quince de…").

Dos trampas que ya costaron tiempo y están resueltas en el código:

1. **El scroll de la invitación no pasa por `window`.** La página va en un
   contenedor fijo con `overflow-y:auto`, y el evento `scroll` de un elemento
   no burbujea. Escuchando en `window`, las secciones de abajo nunca se
   revelaban. El listener va en el contenedor.
2. **GitHub Pages sirve con `Cache-Control: max-age=600`.** `index.html` carga
   `app.js?v=N`: **hay que subir ese número al tocar `app.js` o `app.css`**, si
   no la gente que ya entró sigue con el código viejo hasta 10 minutos.

## Desarrollo

Es estático: cualquier servidor sirve.

```bash
python -m http.server 4191
```

Hay una entrada `invita` en el `launch.json` del laboratorio (puerto 4191).

Para regenerar la tarjeta de vista previa hace falta `sharp`:

```bash
node herramientas/og.mjs
```

## Despliegue

GitHub Pages sobre `main` en la raíz. `git push` y listo, tarda ~1 minuto.

## Monetización

Gratis y sin publicidad. Al pie de cada invitación va un crédito discreto
("Hecha con Invita · haz la tuya gratis") que es el único canal de crecimiento:
una sola invitación la abren entre 30 y 150 personas.

Además, en la pantalla final:

- **Aporte voluntario** a Nequi 3171715071.
- **Versión con link corto** ($20.000): dirección propia del tipo
  `…/maria-y-juan`, sin el crédito abajo y con la foto en buena calidad — que es
  justo lo que el modo gratis no puede dar, porque en el modo gratis la foto
  tiene que caber dentro del link. Se pide por WhatsApp y se arma a mano.

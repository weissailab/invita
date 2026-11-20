/* Invita — invitaciones digitales que se confirman por WhatsApp.
   Todo vive en el link: no hay servidor, ni base de datos, ni cuentas.
   Weiss AI Lab */
(function () {
  'use strict';

  /* El kit compartido de los productos libres. Lo carga core/core.js, que va
     antes que este archivo en index.html. */
  var W = window.Weiss;

  var NEQUI = '3171715071';
  var SOPORTE_WA = '573171715071';
  var APP = document.getElementById('app');

  /* La dirección de esta copia de la app, sin el archivo ni el fragmento.
     De aquí salen todos los links que se comparten. Invita todavía no tiene
     direcciones fijas; el día que las tenga, `W.raizDe(slug)` ya sabe quitar
     el nombre del negocio de la ruta — que es el fallo que ya se comió a
     MiCarta y a MiCita. */
  /* Versión de link corto (la de $20.000): una carpeta del repo, p. ej.
     `sociedad-salesiana/index.html`, define `window.INVITA_FIJA` con los
     datos y su `slug` antes de cargar este archivo. La invitación ya no viaja
     en el link, así que la foto va como archivo en buena calidad. */
  var FIJA = window.INVITA_FIJA || null;
  var BASE = W.raizDe(FIJA && FIJA.slug);

  /* Presupuesto del link. WhatsApp corta los mensajes muy largos y un link
     kilométrico da desconfianza al invitado, así que la foto se comprime hasta
     entrar aquí. Sin foto una invitación pesa ~900 caracteres. */
  var TOPE_LINK = 22000;
  var TOPE_FOTO = 15000; /* bytes del JPEG antes de codificar */

  /* ---------------------------------------------------------------
     TIPOS DE EVENTO
     Cada tipo trae su rótulo, su tema por defecto y el sello del sobre.
     Cambiar de tipo solo cambia lo que el anfitrión no haya tocado.
     --------------------------------------------------------------- */
  var TIPOS = {
    boda:    { ic: '💍', nom: 'Boda',          rot: 'Nos casamos', mio: 'nuestra boda', del: 'a la boda de',            tema: 'clasico',  sello: '&',  frase: 'Y comieron perdices, pero primero bailamos.', rsvp: 'Confirma tu asistencia' },
    quince:  { ic: '👑', nom: 'Quince años',   rot: 'Mis quince años', mio: 'mis quince años', del: 'a los quince de',        tema: 'clasico',  sello: '✦',  frase: 'Hoy dejo de contar los años y empiezo a contar recuerdos.', rsvp: '¿Vienes a mi fiesta?' },
    cumple:  { ic: '🎂', nom: 'Cumpleaños',    rot: 'Cumpleaños', mio: 'mi cumpleaños', del: 'al cumpleaños de',             tema: 'fiesta',   sello: '★',  frase: 'Sin ti no es fiesta.', rsvp: '¿Te apuntas?' },
    baby:    { ic: '🍼', nom: 'Baby shower',   rot: 'Baby shower', mio: 'mi baby shower', del: 'al baby shower de',            tema: 'bebe',     sello: '♡',  frase: 'Viene en camino y queremos celebrarlo contigo.', rsvp: '¿Nos acompañas?' },
    grado:   { ic: '🎓', nom: 'Grado',         rot: 'Me gradúo', mio: 'mi grado', del: 'al grado de',              tema: 'noche',    sello: '✧',  frase: 'Se acabaron los trasnochos. Ahora sí, a celebrar.', rsvp: '¿Me acompañas?' },
    bautizo: { ic: '🕊️', nom: 'Bautizo / Primera comunión', rot: 'Bautizo', mio: 'la celebración', del: 'a la celebración de',   tema: 'botanico', sello: '✚',  frase: 'Un día para dar gracias, en familia.', rsvp: '¿Nos acompañas?' },
    empresa: { ic: '🥂', nom: 'Evento de empresa', rot: 'Te esperamos', mio: 'nuestro evento', del: 'al evento de',       tema: 'tinta',    sello: '◆',  frase: '', rsvp: 'Confirma tu cupo' },
    otro:    { ic: '✨', nom: 'Otro',           rot: 'Estás invitado', mio: 'la celebración', del: 'a la celebración de',         tema: 'clasico',  sello: '✦',  frase: '', rsvp: '¿Nos acompañas?' }
  };

  var TEMAS = {
    clasico:  { nom: 'Clásico',   c1: '#FFFDF9', c2: '#A9873F', c3: '#C08497', part: ['✿', '❀', '·'] },
    noche:    { nom: 'Noche',     c1: '#131A2B', c2: '#D9B872', c3: '#D9B872', part: ['✦', '✧', '·'] },
    botanico: { nom: 'Botánico',  c1: '#F7F8F3', c2: '#6E8B57', c3: '#A8BE8F', part: ['❁', '✽', '·'] },
    fiesta:   { nom: 'Fiesta',    c1: '#FFF9F2', c2: '#E0533D', c3: '#F2B33D', part: ['●', '▲', '■'] },
    bebe:     { nom: 'Bebé',      c1: '#FBF7FF', c2: '#8FA9D8', c3: '#F0B8C8', part: ['♡', '●', '·'] },
    tinta:    { nom: 'Tinta',     c1: '#FFFFFF', c2: '#14120F', c3: '#8C8579', part: [] },
    vino:     { nom: 'Vino',      c1: '#5A0F17', c2: '#E2BE6A', c3: '#B3202E', part: ['✦', '✧', '·'] }
  };

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  /* ---------------------------------------------------------------
     UTILIDADES
     Lo que no sabe nada de invitaciones vive en el core (core/core.js,
     copia de Activos/weiss-core/web/core.js en el repo del Lab). Aquí
     solo se le pone nombre corto para no tocar los sitios donde se usa.
     --------------------------------------------------------------- */

  var esc = W.esc, $ = W.$, $$ = W.$$;
  var toast = W.toast, copiar = W.copiar;
  var waNum = W.waNum, waLink = W.waLink;
  var dosD = W.dosD, hash = W.hash;

  /* --- fechas ---
     La fecha se guarda como 'YYYY-MM-DD' y la hora como 'HH:MM'. Se arma la
     Date con números, nunca con Date.parse de la cadena: en Safari
     '2026-09-12 16:00' no se interpreta igual que en Chrome. */
  function fechaObj(f, h) {
    if (!f) return null;
    var p = f.split('-');
    if (p.length !== 3) return null;
    var hp = (h || '00:00').split(':');
    var d = new Date(+p[0], (+p[1]) - 1, +p[2], +(hp[0] || 0), +(hp[1] || 0), 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  function fechaLarga(f) {
    var d = fechaObj(f, '12:00');
    if (!d) return '';
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function horaBonita(h) {
    if (!h) return '';
    var p = h.split(':');
    var hh = +p[0], mm = p[1] || '00';
    var suf = hh < 12 ? 'a. m.' : 'p. m.';
    var h12 = hh % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + mm + ' ' + suf;
  }

  /* ---------------------------------------------------------------
     EL MODELO
     Claves cortas a propósito: cada letra que se ahorra aquí es un
     carácter menos en el link que el invitado ve en WhatsApp.
     --------------------------------------------------------------- */

  function nueva() {
    return {
      v: 1,
      t: 'boda',
      th: 'clasico',
      a: '', b: '',
      fr: '',
      f: '', h: '',
      lu: '', di: '',
      dc: '',
      ag: [],
      no: '',
      rq: '', rn: '', rt: '',
      w: '',
      ft: '',
      cr: 1,
      ro: '', /* rótulo propio en vez del del tipo (opcional) */
      hf: '', /* hora de fin (opcional) */
      mc: ''  /* mensaje de confirmación propio, tal cual (opcional) */
    };
  }

  function rotulo(d) { return (d.ro || '').trim() || (TIPOS[d.t] || TIPOS.otro).rot; }

  var S = nueva();
  var borrador = W.almacen('invita:borrador');

  function guardar() { borrador.guardar(S); }
  function cargar() { S = borrador.cargar(nueva()); }

  function codificar(d) {
    return LZString.compressToEncodedURIComponent(JSON.stringify(d));
  }

  function decodificar(c) {
    try {
      var j = LZString.decompressFromEncodedURIComponent(c);
      if (!j) return null;
      var d = JSON.parse(j);
      var base = nueva();
      for (var k in base) if (d[k] !== undefined) base[k] = d[k];
      return base;
    } catch (e) { return null; }
  }

  function linkInvitacion(d) { return BASE + '#/i/' + codificar(d); }
  function linkEdicion(d) { return BASE + '#/e/' + codificar(d); }
  function linkPara(d, nombre) {
    var l = linkInvitacion(d);
    return nombre ? l + '/p/' + encodeURIComponent(nombre) : l;
  }

  function nombreEvento(d) {
    var n = (d.a || '').trim();
    if (d.b) n += ' & ' + d.b;
    return n || (TIPOS[d.t] || TIPOS.otro).nom;
  }

  function completa(d) {
    return !!((d.a || '').trim() && d.f && (d.lu || d.di));
  }

  /* ---------------------------------------------------------------
     RUTEO
     --------------------------------------------------------------- */

  var limpiadores = [];
  function limpiar() {
    while (limpiadores.length) { try { limpiadores.pop()(); } catch (e) {} }
  }

  function ir(hash) {
    if (location.hash === hash) pintar();
    else location.hash = hash;
  }

  function pintar() {
    limpiar();
    document.body.classList.remove('viendo');
    var h = location.hash.replace(/^#/, '');

    if (FIJA) {
      var mf = h.match(/^\/p\/(.+)$/);
      var qf = '';
      if (mf) { try { qf = decodeURIComponent(mf[1]); } catch (e) { qf = mf[1]; } }
      var df = nueva();
      for (var kf in df) if (FIJA[kf] !== undefined) df[kf] = FIJA[kf];
      return vistaInvitacion(df, qf);
    }

    var mi =h.match(/^\/i\/([^/]+)(?:\/p\/(.*))?$/);
    if (mi) {
      var d = decodificar(mi[1]);
      if (!d) return vistaError();
      var quien = '';
      try { quien = decodeURIComponent(mi[2] || ''); } catch (e) { quien = mi[2] || ''; }
      return vistaInvitacion(d, quien);
    }

    var me = h.match(/^\/e\/([^/]+)$/);
    if (me) {
      var e = decodificar(me[1]);
      if (e) { S = e; guardar(); }
      return ir('#/crear');
    }

    if (h === '/crear') return vistaEditor();
    if (h === '/listo') return vistaListo();
    if (h === '/ejemplo') return vistaInvitacion(ejemplo(), 'María');
    return vistaLanding();
  }

  function vistaError() {
    document.title = 'Invitación no encontrada — Invita';
    APP.innerHTML = '<div class="wrap centro">' +
      '<div class="card"><h2>Este link no se pudo abrir 😕</h2>' +
      '<p class="cs">Puede que se haya cortado al copiarlo o al pegarlo. Pídele a quien te invitó que te lo mande otra vez completo.</p>' +
      '<a class="btn" href="' + esc(BASE) + '">Ir a Invita</a></div></div>';
  }

  /* ---------------------------------------------------------------
     LANDING
     --------------------------------------------------------------- */

  function vistaLanding() {
    document.title = 'Invita — invitaciones digitales que se confirman por WhatsApp, gratis';
    var hayBorrador = !!(S.a || S.f || S.lu);

    APP.innerHTML =
      '<div class="wrap">' +
        '<div class="hero">' +
          '<div class="kicker">Weiss AI Lab</div>' +
          '<h1>Tu invitación se abre<br>como un <em>sobre</em></h1>' +
          '<p>Bodas, quince, cumpleaños, grados. La armas en 3 minutos, la mandas por WhatsApp y cada invitado te confirma con su nombre.</p>' +
          '<div class="btns">' +
            '<button class="btn" data-act="crear">' + (hayBorrador ? 'Seguir con la mía' : 'Crear mi invitación') + '</button>' +
            '<a class="btn ghost" href="#/ejemplo">Ver un ejemplo</a>' +
          '</div>' +
          '<p class="cs" style="margin-top:14px">Gratis · sin registro · sin instalar nada</p>' +
        '</div>' +

        '<div class="card">' +
          '<ul class="puntos">' +
            '<li><span class="ic">💌</span><div><b>Se abre como un sobre lacrado</b><span class="cs">Con el nombre del invitado escrito encima. Toca, se abre, y aparece la invitación.</span></div></li>' +
            '<li><span class="ic">✅</span><div><b>Confirman por WhatsApp, no por formulario</b><span class="cs">Te llega «Soy María, vamos 3». Sin listas raras ni contraseñas.</span></div></li>' +
            '<li><span class="ic">🔗</span><div><b>Un link distinto para cada invitado</b><span class="cs">Pegas tu lista y te devuelve el link personalizado de cada uno, listo para mandar.</span></div></li>' +
            '<li><span class="ic">⏳</span><div><b>Cuenta regresiva en vivo</b><span class="cs">Y botones de «cómo llegar» y «agendar» que sí funcionan en el celular.</span></div></li>' +
            '<li><span class="ic">💸</span><div><b>Lluvia de sobres</b><span class="cs">Si quieres, tus invitados ven tu Nequi para el regalo. Sin intermediarios: el dinero te llega directo.</span></div></li>' +
          '</ul>' +
        '</div>' +

        '<div class="card">' +
          '<h2>Cómo funciona</h2>' +
          '<ol class="pasos">' +
            '<li>Llenas los datos de tu evento y escoges el estilo.</li>' +
            '<li>Te queda un link. Nada se guarda en ningún servidor: la invitación viaja dentro del link.</li>' +
            '<li>Lo mandas por WhatsApp. Cada quien abre su sobre y te confirma.</li>' +
          '</ol>' +
        '</div>' +

        '<div class="card nequi">' +
          '<h3>¿Por qué es gratis?</h3>' +
          '<p class="cs">Porque no cuesta nada operarlo: no hay servidor detrás. Si te sirvió y quieres que siga así para el que viene detrás, me mandas lo que consideres a Nequi.</p>' +
          '<div class="num">Nequi ' + NEQUI + '</div>' +
          '<div class="btns"><button class="btn ghost chico" data-act="copiar-nequi">Copiar el número</button></div>' +
        '</div>' +

        '<div class="pie">Hecho por <b>Weiss AI Lab</b> · <a target="_blank" rel="noopener" href="' + esc(waLink(SOPORTE_WA, 'Hola, quiero preguntar algo sobre Invita')) + '">Escríbenos por WhatsApp</a></div>' +
      '</div>';

    APP.onclick = function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'crear') ir('#/crear');
      if (a === 'copiar-nequi') copiar(NEQUI, 'Número de Nequi copiado 🙏');
    };
  }

  function ejemplo() {
    var hoy = new Date();
    var d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 42);
    return {
      v: 1, t: 'boda', th: 'clasico',
      a: 'María', b: 'Juan',
      fr: 'Después de diez años, por fin nos animamos.',
      f: d.getFullYear() + '-' + dosD(d.getMonth() + 1) + '-' + dosD(d.getDate()),
      h: '16:00',
      lu: 'Hacienda El Paraíso',
      di: 'Vía a Palmira, Valle del Cauca',
      dc: 'Elegante, colores claros',
      ag: [['16:00', 'Ceremonia'], ['17:30', 'Brindis'], ['19:00', 'Fiesta']],
      no: 'La finca queda a 40 minutos de Cali. Si vienes de lejos, avísanos y te ayudamos con el hospedaje.',
      rq: 'nequi', rn: '3001234567', rt: '',
      w: '3001234567',
      ft: '', cr: 1
    };
  }

  /* ---------------------------------------------------------------
     EDITOR
     --------------------------------------------------------------- */

  var sobreAbiertoPrev = false; /* el sobre no se vuelve a cerrar al teclear */

  function vistaEditor() {
    document.title = 'Armando tu invitación — Invita';
    var T = TIPOS[S.t] || TIPOS.otro;

    APP.innerHTML =
      '<div class="barra">' +
        '<div class="marca"><span>💌</span> Invita</div>' +
        '<button class="btn ghost chico" data-act="inicio">Salir</button>' +
        '<button class="btn chico" data-act="listo">Ya está lista →</button>' +
      '</div>' +
      '<div class="wrap ancho"><div class="col2">' +
        '<div class="principal">' +

          '<div class="card">' +
            '<h3>¿Qué vamos a celebrar?</h3>' +
            '<div class="chips" id="tipos">' + Object.keys(TIPOS).map(function (k) {
              return '<button class="chip" data-tipo="' + k + '" aria-pressed="' + (S.t === k) + '">' +
                TIPOS[k].ic + ' ' + esc(TIPOS[k].nom) + '</button>';
            }).join('') + '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h3>Los protagonistas</h3>' +
            '<div class="fila">' +
              campo('a', S.t === 'boda' || S.t === 'bautizo' ? 'Primer nombre' : 'Nombre', 'María', 'texto') +
              campo('b', 'Segundo nombre <span class="pista">opcional (para parejas)</span>', 'Juan', 'texto') +
            '</div>' +
            campoArea('fr', 'Frase de la invitación <span class="pista">opcional</span>', T.frase || 'Nos encantaría verte ese día.') +
          '</div>' +

          '<div class="card">' +
            '<h3>Cuándo</h3>' +
            '<div class="fila">' +
              campo('f', 'Fecha', '', 'date') +
              campo('h', 'Hora', '', 'time') +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h3>Dónde</h3>' +
            campo('lu', 'Nombre del lugar', 'Hacienda El Paraíso', 'texto') +
            campo('di', 'Dirección <span class="pista">con esto se arma el botón «cómo llegar»</span>', 'Vía a Palmira, Valle del Cauca', 'texto') +
          '</div>' +

          '<div class="card">' +
            '<h3>Detalles <span class="cs">(opcionales)</span></h3>' +
            campo('dc', 'Código de vestuario', 'Elegante, colores claros', 'texto') +
            '<div class="campo"><label>Programa del día</label>' +
              '<div class="lista-ag" id="agenda">' + S.ag.map(function (it, i) {
                return '<div class="it" data-i="' + i + '">' +
                  '<input class="h" data-ag="h" type="time" value="' + esc(it[0]) + '">' +
                  '<input class="q" data-ag="q" type="text" placeholder="Ceremonia" value="' + esc(it[1]) + '">' +
                  '<button class="quitar" data-act="quitar-ag" aria-label="Quitar">✕</button></div>';
              }).join('') + '</div>' +
              '<button class="btn ghost chico" data-act="mas-ag">+ Agregar un momento</button>' +
            '</div>' +
            campoArea('no', 'Nota para tus invitados', 'La finca queda a 40 minutos. Si vienes de lejos, avísanos.') +
          '</div>' +

          '<div class="card">' +
            '<h3>Regalos <span class="cs">(opcional)</span></h3>' +
            '<p class="cs">La «lluvia de sobres», pero sin sobres. El dinero le llega directo a tu Nequi: Invita no toca un peso.</p>' +
            '<div class="chips" style="margin-bottom:12px">' +
              '<button class="chip" data-rq="" aria-pressed="' + (!S.rq) + '">No mostrar nada</button>' +
              '<button class="chip" data-rq="nequi" aria-pressed="' + (S.rq === 'nequi') + '">Mi Nequi</button>' +
              '<button class="chip" data-rq="texto" aria-pressed="' + (S.rq === 'texto') + '">Un mensaje mío</button>' +
            '</div>' +
            (S.rq === 'nequi' ? campo('rn', 'Tu número de Nequi', '3001234567', 'tel') : '') +
            (S.rq === 'texto' ? campoArea('rt', 'Qué quieres decirles', 'Tu presencia es el mejor regalo.') : '') +
          '</div>' +

          '<div class="card">' +
            '<h3>Foto <span class="cs">(opcional)</span></h3>' +
            '<p class="cs">Ojo: la foto viaja dentro del link, así que lo alarga bastante. Si tus invitados van a recibirlo por WhatsApp, se ve más elegante sin foto.</p>' +
            (S.ft ? '<div class="retrato-mar" style="padding:0;margin-bottom:10px"><img src="' + esc(S.ft) + '" alt="" style="max-height:180px;width:auto;border-radius:10px"></div>' : '') +
            '<div class="btns">' +
              '<label class="btn ghost chico" style="position:relative;overflow:hidden">' + (S.ft ? 'Cambiar la foto' : 'Subir una foto') +
                '<input type="file" accept="image/*" id="foto" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>' +
              (S.ft ? '<button class="btn ghost chico" data-act="quitar-foto">Quitar la foto</button>' : '') +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h3>Confirmaciones</h3>' +
            campo('w', 'Tu WhatsApp <span class="pista">a este número te llegan las confirmaciones</span>', '3001234567', 'tel') +
          '</div>' +

          '<div class="card">' +
            '<h3>Estilo</h3>' +
            '<div class="temas" id="temas">' + Object.keys(TEMAS).map(function (k) {
              var t = TEMAS[k];
              return '<button class="tema-op" data-tema="' + k + '" aria-pressed="' + (S.th === k) + '">' +
                '<div class="muestra" style="background:linear-gradient(140deg,' + t.c1 + ' 40%,' + t.c2 + ')"></div>' +
                esc(t.nom) + '</button>';
            }).join('') + '</div>' +
          '</div>' +

          '<div class="btns" style="margin-bottom:26px"><button class="btn ancho" data-act="listo">Ya está lista →</button></div>' +
        '</div>' +

        '<div class="lado">' +
          '<div class="card" style="padding:14px">' +
            '<h3 style="margin-bottom:4px">Así la van a ver</h3>' +
            '<p class="cs" style="margin-bottom:12px">Toca el sobre para abrirlo.</p>' +
            '<div class="marco"><div class="pantalla" id="previa"></div></div>' +
            '<div id="peso" style="margin-top:12px"></div>' +
          '</div>' +
        '</div>' +
      '</div></div>';

    /* --- eventos del editor --- */
    APP.oninput = function (ev) {
      var el = ev.target;
      var k = el.getAttribute('data-k');
      if (k) { S[k] = el.value; guardar(); previa(); return; }
      if (el.getAttribute('data-ag')) {
        var it = el.closest('.it');
        var i = +it.getAttribute('data-i');
        var cual = el.getAttribute('data-ag') === 'h' ? 0 : 1;
        if (S.ag[i]) { S.ag[i][cual] = el.value; guardar(); previa(); }
      }
    };

    APP.onclick = function (ev) {
      var el = ev.target.closest('[data-tipo],[data-tema],[data-rq],[data-act]');
      if (!el) return;

      if (el.hasAttribute('data-tipo')) {
        var nuevoT = el.getAttribute('data-tipo');
        var antes = TIPOS[S.t] || TIPOS.otro;
        S.t = nuevoT;
        /* el tema sigue al tipo solo si el anfitrión no lo había escogido a mano */
        if (S.th === antes.tema) S.th = TIPOS[nuevoT].tema;
        guardar();
        return vistaEditor();
      }
      if (el.hasAttribute('data-tema')) {
        S.th = el.getAttribute('data-tema');
        guardar();
        $$('#temas .tema-op').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-tema') === S.th));
        });
        return previa();
      }
      if (el.hasAttribute('data-rq')) {
        S.rq = el.getAttribute('data-rq');
        guardar();
        return vistaEditor();
      }

      var a = el.getAttribute('data-act');
      if (a === 'inicio') return ir('#/');
      if (a === 'listo') {
        if (!completa(S)) return toast('Faltan el nombre, la fecha y el lugar');
        return ir('#/listo');
      }
      if (a === 'mas-ag') {
        S.ag.push(['', '']);
        guardar();
        return vistaEditor();
      }
      if (a === 'quitar-ag') {
        S.ag.splice(+el.closest('.it').getAttribute('data-i'), 1);
        guardar();
        return vistaEditor();
      }
      if (a === 'quitar-foto') {
        S.ft = '';
        guardar();
        return vistaEditor();
      }
    };

    var inp = $('#foto');
    if (inp) inp.onchange = function () {
      if (this.files && this.files[0]) comprimirFoto(this.files[0]);
    };

    previa();
  }

  function campo(k, etiqueta, ph, tipo) {
    var t = tipo === 'texto' ? 'text' : tipo;
    return '<div class="campo"><label for="c_' + k + '">' + etiqueta + '</label>' +
      '<input id="c_' + k + '" data-k="' + k + '" type="' + t + '" placeholder="' + esc(ph) + '" value="' + esc(S[k]) + '"' +
      (tipo === 'tel' ? ' inputmode="numeric"' : '') + '></div>';
  }

  function campoArea(k, etiqueta, ph) { return W.campoArea(k, etiqueta, ph, S[k]); }

  /* La foto se reduce hasta caber en el presupuesto. Se baja primero la
     calidad y, si aun así no entra, el ancho: una foto borrosa se ve mal, pero
     un link que WhatsApp corta a la mitad no se ve: no llega. */
  function comprimirFoto(file) {
    toast('Procesando la foto…');
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var anchos = [640, 520, 420, 340];
        var calidades = [0.72, 0.6, 0.5, 0.42, 0.34];
        for (var i = 0; i < anchos.length; i++) {
          var w = Math.min(anchos[i], img.width);
          var h = Math.round(img.height * (w / img.width));
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          for (var j = 0; j < calidades.length; j++) {
            var url = c.toDataURL('image/jpeg', calidades[j]);
            if (url.length * 0.75 <= TOPE_FOTO) {
              S.ft = url;
              guardar();
              vistaEditor();
              return toast('Foto lista ✨');
            }
          }
        }
        toast('Esa foto no se pudo achicar lo suficiente 😕');
      };
      img.onerror = function () { toast('No se pudo leer esa imagen'); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  var previaT = null;
  function previa() {
    clearTimeout(previaT);
    previaT = setTimeout(function () {
      var cont = $('#previa');
      if (!cont) return;
      var arriba = cont.scrollTop;
      pintarInvitacion(cont, S, 'María', { previa: true });
      cont.scrollTop = arriba;
      pintarPeso();
    }, 160);
  }

  function pintarPeso() {
    var caja = $('#peso');
    if (!caja) return;
    var n = linkInvitacion(S).length;
    var pct = Math.min(100, Math.round(n / TOPE_LINK * 100));
    var clase = pct > 85 ? 'rojo' : (pct > 45 ? 'amb' : '');
    var texto = pct > 85
      ? 'El link quedó muy largo. Quita la foto si vas a mandarlo por WhatsApp.'
      : (pct > 45 ? 'El link quedó largo por la foto, pero todavía sirve.' : 'El link quedó corto y limpio 👌');
    caja.innerHTML = '<div class="medidor ' + clase + '"><i style="width:' + Math.max(4, pct) + '%"></i></div>' +
      '<div class="cs">' + esc(texto) + ' <span style="opacity:.6">(' + n + ' caracteres)</span></div>';
  }

  /* ---------------------------------------------------------------
     PANTALLA DE «YA ESTÁ LISTA»
     Aquí es donde el anfitrión saca los links, uno por invitado.
     --------------------------------------------------------------- */

  var LSI = 'invita:invitados';

  function vistaListo() {
    if (!completa(S)) return ir('#/crear');
    document.title = 'Tu invitación está lista — Invita';

    var link = linkInvitacion(S);
    var edic = linkEdicion(S);
    var lista = '';
    try { lista = localStorage.getItem(LSI) || ''; } catch (e) {}

    APP.innerHTML =
      '<div class="barra">' +
        '<div class="marca"><span>💌</span> Invita</div>' +
        '<button class="btn ghost chico" data-act="volver">← Seguir editando</button>' +
      '</div>' +
      '<div class="wrap">' +
        '<div class="centro" style="padding:14px 0 6px">' +
          '<h1 style="font-family:var(--serif);font-size:34px">¡Tu invitación está lista!</h1>' +
          '<p class="cs">Mándala por WhatsApp. Cuando la abran, te confirman a tu número.</p>' +
        '</div>' +

        '<div class="card">' +
          '<h3>1. El link de tu invitación</h3>' +
          '<div class="linkbox" style="margin-bottom:12px">' + esc(link) + '</div>' +
          '<div class="btns">' +
            '<button class="btn" data-act="compartir">Compartir</button>' +
            '<button class="btn ghost" data-act="copiar-link">Copiar el link</button>' +
            '<a class="btn ghost" href="' + esc(link) + '" target="_blank" rel="noopener">Abrirla</a>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3>2. Un link para cada invitado ✨</h3>' +
          '<p class="cs">Escribe un invitado por línea. Si le pones el celular después de una coma, te queda el botón para mandársela de una.</p>' +
          '<div class="campo"><textarea id="lista" placeholder="María Fernanda, 3001234567&#10;Tío Jorge&#10;Familia Ramírez, 3109876543"></textarea></div>' +
          '<button class="btn ghost chico" data-act="armar">Armar los links</button>' +
          '<div id="tabla" style="margin-top:14px"></div>' +
        '</div>' +

        '<div class="card">' +
          '<h3>3. Guarda esto para después</h3>' +
          '<p class="cs">Como no hay cuentas ni contraseñas, <b>este es el único modo de volver a editar tu invitación</b>. Mándatelo a ti mismo por WhatsApp ahora mismo y no lo pierdas.</p>' +
          '<div class="btns">' +
            '<a class="btn wa" target="_blank" rel="noopener" href="' + esc(waLink(SOPORTE_WA, 'Guardo aquí mi link de edición de Invita (no lo pierdas): ' + edic)) + '">Mandármelo por WhatsApp</a>' +
            '<button class="btn ghost" data-act="copiar-edicion">Copiar el link de edición</button>' +
          '</div>' +
        '</div>' +

        '<div class="card nequi">' +
          '<h3>¿Te sirvió? 🙏</h3>' +
          '<p class="cs">Invita es gratis y sin publicidad. Si te ahorró una tarde y unos pesos de diseño, mándame lo que consideres a Nequi. Con eso sigue siendo gratis para el que viene detrás.</p>' +
          '<div class="num">Nequi ' + NEQUI + '</div>' +
          '<div class="btns">' +
            '<button class="btn" data-act="copiar-nequi">Copiar el número</button>' +
            '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(waLink(SOPORTE_WA, '¡Hola! Ya armé mi invitación con Invita y te acabo de enviar un aporte a Nequi 🙌')) + '">Ya lo hice ✅</a>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3>¿La quieres con link corto y sin mi marca?</h3>' +
          '<p class="cs">Por <b>$20.000</b> te dejo la invitación en una dirección bonita del tipo <code>…/maria-y-juan</code>, sin el crédito de Invita abajo y con la foto en buena calidad (así no alarga el link). Te la dejo lista el mismo día.</p>' +
          '<a class="btn plano" target="_blank" rel="noopener" href="' + esc(waLink(SOPORTE_WA, 'Hola, quiero la versión con link corto de mi invitación de Invita. Esta es: ' + link)) + '">Pedirla por WhatsApp</a>' +
        '</div>' +

        '<div class="pie">Hecho por <b>Weiss AI Lab</b></div>' +
      '</div>';

    var ta = $('#lista');
    if (ta && lista) { ta.value = lista; armarInvitados(); }

    APP.onclick = function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'volver') return ir('#/crear');
      if (a === 'copiar-link') return copiar(link, 'Link copiado ✨');
      if (a === 'copiar-edicion') return copiar(edic, 'Link de edición copiado 🔐');
      if (a === 'copiar-nequi') return copiar(NEQUI, 'Número de Nequi copiado 🙏');
      if (a === 'armar') return armarInvitados();
      if (a === 'copiar-inv') return copiar(b.getAttribute('data-link'), 'Link de ' + b.getAttribute('data-nom') + ' copiado ✨');
      if (a === 'compartir') {
        var texto = mensajeInvitacion(S, '') + '\n' + link;
        if (navigator.share) {
          navigator.share({ text: texto }).catch(function () {});
        } else {
          copiar(texto, 'Mensaje copiado, ya puedes pegarlo en WhatsApp ✨');
        }
      }
    };
  }

  function mensajeInvitacion(d, quien) {
    var T = TIPOS[d.t] || TIPOS.otro;
    var enc = quien ? quien + ', ' : '';
    return enc + 'te comparto la invitación a ' + T.mio + '. Ábrela aquí 👇';
  }

  function armarInvitados() {
    var ta = $('#lista');
    var caja = $('#tabla');
    if (!ta || !caja) return;
    try { localStorage.setItem(LSI, ta.value); } catch (e) {}

    var filas = ta.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!filas.length) { caja.innerHTML = '<p class="cs">Escribe al menos un nombre arriba.</p>'; return; }

    caja.innerHTML = '<table class="invitados"><tbody>' + filas.map(function (l) {
      var p = l.split(',');
      var nom = p[0].trim();
      var tel = (p[1] || '').trim();
      var lk = linkPara(S, nom);
      var acc = '<button class="btn ghost chico" data-act="copiar-inv" data-nom="' + esc(nom) + '" data-link="' + esc(lk) + '">Copiar</button>';
      if (tel) {
        acc = '<a class="btn wa chico" target="_blank" rel="noopener" href="' +
          esc(waLink(tel, mensajeInvitacion(S, nom) + '\n' + lk)) + '">Enviar</a> ' + acc;
      }
      return '<tr><td>' + esc(nom) + '</td><td>' + acc + '</td></tr>';
    }).join('') + '</tbody></table>' +
      '<p class="cs" style="margin-top:10px">' + filas.length + ' invitado' + (filas.length === 1 ? '' : 's') +
      '. Cada uno abre su sobre con su nombre escrito.</p>';
  }

  /* ---------------------------------------------------------------
     LA INVITACIÓN (lo que ve el invitado)
     --------------------------------------------------------------- */

  function vistaInvitacion(d, quien) {
    document.title = FIJA && FIJA.titulo ? FIJA.titulo : nombreEvento(d) + ' — ' + rotulo(d);
    document.body.classList.add('viendo');
    APP.className = 'pagina-inv';
    APP.innerHTML = '';
    pintarInvitacion(APP, d, quien, { previa: false });
  }

  function pintarInvitacion(cont, d, quien, opts) {
    var T = TIPOS[d.t] || TIPOS.otro;
    var tema = TEMAS[d.th] ? d.th : 'clasico';
    var nom = (d.a || '').trim();
    var largo = ((d.a || '') + (d.b || '')).length > 18;

    var partes = [];

    /* --- el sobre --- */
    partes.push(
      '<div class="sobre" id="sobre">' +
        '<div>' +
          '<div class="paquete" id="paquete" role="button" tabindex="0" aria-label="Abrir la invitación">' +
            '<div class="cuerpo">' +
              '<div class="tarjetita"></div>' +
              '<div class="solapa"></div>' +
              '<div class="sello">' + T.sello + '</div>' +
            '</div>' +
          '</div>' +
          (quien ? '<div class="quien">' + esc(quien) + '</div>' : '<div class="quien">Estás invitado</div>') +
          '<div class="toca">tienes una invitación<b>Toca el sobre para abrirla</b></div>' +
        '</div>' +
      '</div>');

    /* --- partículas --- */
    var chars = TEMAS[tema].part;
    if (chars.length) {
      var ps = [];
      for (var i = 0; i < 16; i++) {
        var c = chars[i % chars.length];
        var izq = Math.round((i * 6.4 + (i % 5) * 3.7) % 96) + 2;
        var dur = 9 + (i % 6) * 2.4;
        var dly = -(i * 1.7).toFixed(1);
        var tam = 9 + (i % 4) * 5;
        var col = i % 3 === 0 ? 'var(--acento)' : 'var(--oro)';
        ps.push('<i style="left:' + izq + '%;font-size:' + tam + 'px;color:' + col +
          ';animation-duration:' + dur + 's;animation-delay:' + dly + 's">' + c + '</i>');
      }
      partes.push('<div class="particulas" aria-hidden="true">' + ps.join('') + '</div>');
    }

    /* --- portada --- */
    partes.push('<div class="hoja">' +
      '<div class="portada">' +
        (quien ? '<div class="saludo">' + esc(quien) + ',</div>' : '') +
        '<div class="tipo">' + esc(rotulo(d)) + '</div>' +
        orn() +
        '<div class="nom' + (largo ? ' largo' : '') + '">' + esc(nom) + '</div>' +
        (d.b ? '<div class="amp">&amp;</div><div class="nom' + (largo ? ' largo' : '') + '">' + esc(d.b) + '</div>' : '') +
        (d.fr ? '<div class="frase' + (d.fr.length > 140 ? ' larga' : '') + '">' + esc(d.fr) + '</div>' : '') +
      '</div>');

    if (d.ft) {
      partes.push('<div class="retrato-mar reveal"><img class="retrato" src="' + esc(d.ft) + '" alt=""></div>');
    }

    /* --- cuándo --- */
    partes.push('<div class="bloque reveal">' +
      '<div class="rot">Cuándo</div>' +
      '<div class="gr">' + esc(fechaLarga(d.f)) + '</div>' +
      (d.h ? '<div class="md">' + esc(horaBonita(d.h) + (d.hf ? ' a ' + horaBonita(d.hf) : '')) + '</div>' : '') +
      '<div class="cuenta" id="cuenta"></div>' +
      '<div class="ibtns"><button class="ibtn linea" data-act="ics">Agendar 📅</button></div>' +
    '</div>');

    /* --- dónde --- */
    if (d.lu || d.di) {
      var q = encodeURIComponent(((d.lu || '') + ' ' + (d.di || '')).trim());
      partes.push('<div class="bloque reveal">' +
        '<div class="rot">Dónde</div>' +
        (d.lu ? '<div class="gr">' + esc(d.lu) + '</div>' : '') +
        (d.di ? '<div class="ch">' + esc(d.di) + '</div>' : '') +
        '<div class="ibtns"><a class="ibtn linea" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + q + '">Cómo llegar 📍</a></div>' +
      '</div>');
    }

    if (d.dc) {
      partes.push('<div class="bloque reveal"><div class="rot">Código de vestuario</div><div class="md">' + esc(d.dc) + '</div></div>');
    }

    var ag = (d.ag || []).filter(function (it) { return it && (it[0] || it[1]); });
    if (ag.length) {
      partes.push('<div class="bloque reveal"><div class="rot">El día</div><ul class="agenda">' +
        ag.map(function (it) {
          return '<li><span class="h">' + esc(horaBonita(it[0]) || '') + '</span><span>' + esc(it[1]) + '</span></li>';
        }).join('') + '</ul></div>');
    }

    if (d.no) {
      partes.push('<div class="bloque reveal"><div class="rot">Nota</div><div class="md">' + esc(d.no) + '</div></div>');
    }

    /* --- regalos --- */
    if (d.rq === 'nequi' && d.rn) {
      partes.push('<div class="bloque reveal">' +
        '<div class="rot">Lluvia de sobres</div>' +
        '<div class="md">Si quieres regalarnos algo, un aporte a nuestro Nequi nos ayuda muchísimo.</div>' +
        '<div class="gr" style="margin-top:8px">' + esc(d.rn) + '</div>' +
        '<div class="ibtns"><button class="ibtn linea" data-act="copiar-regalo" data-n="' + esc(d.rn) + '">Copiar el número</button></div>' +
      '</div>');
    } else if (d.rq === 'texto' && d.rt) {
      partes.push('<div class="bloque reveal"><div class="rot">Regalos</div><div class="md">' + esc(d.rt) + '</div></div>');
    }

    /* --- confirmar --- */
    if (d.w) {
      partes.push('<div class="rsvp reveal">' +
        '<div class="rot" style="font-size:11.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--oro);font-weight:700;margin-bottom:8px">' + esc(T.rsvp) + '</div>' +
        '<div class="gr">Avísanos si vienes</div>' +
        '<div class="ch" style="color:var(--suave);font-size:14px">Se abre tu WhatsApp con el mensaje escrito. Solo le das enviar.</div>' +
        /* con mensaje propio el contador no llegaría a ningún lado: se oculta */
        (d.mc ? '' : '<div class="acomp">' +
          '<button data-act="menos" aria-label="Menos personas">−</button>' +
          '<span class="v" id="cuantos">1 persona</span>' +
          '<button data-act="mas" aria-label="Más personas">+</button>' +
        '</div>') +
        '<a class="ibtn" id="btn-rsvp" target="_blank" rel="noopener" href="#">Confirmar mi asistencia ✅</a>' +
      '</div>');
    }

    if (d.cr) {
      partes.push('<div class="creditos">Hecha con <a href="' + esc(BASE) + '" target="_blank" rel="noopener">Invita 💌</a> · haz la tuya gratis</div>');
    }
    partes.push('</div>'); /* .hoja */

    cont.innerHTML = '<div class="inv" data-tema="' + tema + '">' + partes.join('') + '</div>';

    conectarInvitacion(cont, d, quien, opts || {});
  }

  function orn() {
    return '<svg class="orn" viewBox="0 0 128 14" aria-hidden="true">' +
      '<path d="M2 7h40"/><path d="M86 7h40"/>' +
      '<path d="M52 7c4-6 8-6 12 0s8 6 12 0"/>' +
      '<circle class="p" cx="46" cy="7" r="1.6"/><circle class="p" cx="82" cy="7" r="1.6"/>' +
      '</svg>';
  }

  function conectarInvitacion(cont, d, quien, opts) {
    var raiz = cont.querySelector('.inv');
    var sobre = cont.querySelector('#sobre');

    /* Mientras el sobre está cerrado no se debe poder hacer scroll por debajo:
       arruinaría la sorpresa. */
    var abierto = opts.previa ? sobreAbiertoPrev : false;
    function aplicar() {
      if (abierto) sobre.classList.add('abierto');
      else sobre.classList.remove('abierto');
      if (opts.previa) {
        cont.style.overflowY = abierto ? 'auto' : 'hidden';
        sobreAbiertoPrev = abierto;
      } else {
        document.documentElement.style.overflow = abierto ? '' : 'hidden';
        APP.style.overflowY = abierto ? 'auto' : 'hidden';
      }
    }
    function abrir() {
      if (abierto) return;
      abierto = true;
      aplicar();
      setTimeout(revelar, 420);
    }
    aplicar();

    var paq = cont.querySelector('#paquete');
    if (paq) {
      paq.addEventListener('click', abrir);
      paq.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
      });
    }
    if (sobre) sobre.addEventListener('click', abrir);

    /* --- revelado al bajar ---
       El scroll SIEMPRE ocurre dentro de `cont` (el marco del editor, o el
       .pagina-inv que está fijo a la ventana). Escuchar en `window` no sirve:
       el evento scroll de un elemento no burbujea, y las secciones de abajo
       se quedaban invisibles para siempre. */
    var items = $$('.reveal', cont);
    function revelar() {
      var caja = cont.getBoundingClientRect();
      items.forEach(function (el) {
        if (el.getBoundingClientRect().top - caja.top < caja.height - 40) el.classList.add('visto');
      });
    }
    cont.addEventListener('scroll', revelar, { passive: true });
    limpiadores.push(function () { cont.removeEventListener('scroll', revelar); });
    setTimeout(revelar, 60);

    /* --- cuenta regresiva --- */
    var caja = cont.querySelector('#cuenta');
    var meta = fechaObj(d.f, d.h || '12:00');
    if (caja && meta) {
      var tic = function () {
        if (!document.body.contains(caja)) return clearInterval(iv);
        var ms = meta.getTime() - Date.now();
        if (ms <= 0) {
          var mismoDia = new Date().toDateString() === meta.toDateString();
          caja.className = 'cuenta hoy';
          caja.innerHTML = '<div class="u" style="min-width:auto;padding:12px 18px"><div class="n" style="font-size:22px">' +
            (mismoDia ? '¡Hoy es el día!' : 'Gracias por acompañarnos') + '</div></div>';
          return;
        }
        var seg = Math.floor(ms / 1000);
        var dd = Math.floor(seg / 86400);
        var hh = Math.floor(seg % 86400 / 3600);
        var mm = Math.floor(seg % 3600 / 60);
        var ss = seg % 60;
        caja.className = 'cuenta';
        caja.innerHTML =
          u(dd, dd === 1 ? 'día' : 'días') + u(dosD(hh), 'horas') + u(dosD(mm), 'min') + u(dosD(ss), 'seg');
      };
      var u = function (n, e) { return '<div class="u"><div class="n">' + n + '</div><div class="e">' + e + '</div></div>'; };
      tic();
      var iv = setInterval(tic, 1000);
      limpiadores.push(function () { clearInterval(iv); });
    }

    /* --- confirmar asistencia --- */
    var cuantos = 1;
    var etiqueta = cont.querySelector('#cuantos');
    var btn = cont.querySelector('#btn-rsvp');
    function refrescarRsvp() {
      if (etiqueta) etiqueta.textContent = cuantos + (cuantos === 1 ? ' persona' : ' personas');
      if (btn) {
        var yo = quien ? 'Soy ' + quien + '. ' : '';
        var T = TIPOS[d.t] || TIPOS.otro;
        var txt = d.mc ? d.mc : '¡Hola! Confirmo mi asistencia ' + T.del + ' ' + nombreEvento(d) + '. ' +
          yo + (cuantos === 1 ? 'Voy yo solo.' : 'Vamos ' + cuantos + ' personas.') + ' 🎉';
        btn.href = waLink(d.w, txt);
      }
    }
    refrescarRsvp();

    raiz.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'mas') { cuantos = Math.min(20, cuantos + 1); refrescarRsvp(); }
      if (a === 'menos') { cuantos = Math.max(1, cuantos - 1); refrescarRsvp(); }
      if (a === 'copiar-regalo') copiar(b.getAttribute('data-n'), 'Número copiado 💛');
      if (a === 'ics') descargarICS(d);
    });
  }

  /* Un .ics de verdad, armado en el navegador. Es el único formato que
     entienden a la vez el calendario de Android, el de iPhone y Outlook. */
  function descargarICS(d) {
    var ini = fechaObj(d.f, d.h || '12:00');
    if (!ini) return;
    var fin = d.hf ? fechaObj(d.f, d.hf) : null;
    if (!fin || fin <= ini) fin = new Date(ini.getTime() + 4 * 3600 * 1000);
    function z(x) {
      return x.getUTCFullYear() + dosD(x.getUTCMonth() + 1) + dosD(x.getUTCDate()) + 'T' +
        dosD(x.getUTCHours()) + dosD(x.getUTCMinutes()) + '00Z';
    }
    function lim(s) { return String(s || '').replace(/[\\;,]/g, function (m) { return '\\' + m; }).replace(/\n/g, '\\n'); }
    var T = TIPOS[d.t] || TIPOS.otro;
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Weiss AI Lab//Invita//ES', 'BEGIN:VEVENT',
      'UID:' + Math.abs(hash(codificar(d))) + '@invita',
      'DTSTAMP:' + z(new Date()),
      'DTSTART:' + z(ini), 'DTEND:' + z(fin),
      'SUMMARY:' + lim(rotulo(d) + ' ' + nombreEvento(d)),
      'LOCATION:' + lim(((d.lu || '') + ' ' + (d.di || '')).trim()),
      'DESCRIPTION:' + lim(d.fr || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'invitacion.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 1200);
    toast('Guardado en tu calendario 📅');
  }

  /* ---------------------------------------------------------------
     ARRANQUE
     --------------------------------------------------------------- */

  function arrancar() {
    cargar();
    window.addEventListener('hashchange', function () {
      APP.className = '';
      document.documentElement.style.overflow = '';
      APP.style.overflowY = '';
      APP.onclick = null;
      APP.oninput = null;
      pintar();
    });
    pintar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();

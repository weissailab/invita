/* Arma la tarjeta de vista previa (og.png) de Invita.
   Es lo que ve el invitado en WhatsApp antes de abrir el link, así que el
   dibujo es un sobre lacrado: la misma promesa que cumple la página. */
import sharp from 'file:///C:/Users/ASUS/Documents/Weiss-AI-Lab/Proyectos/Panel-Cliente/codigo/node_modules/sharp/lib/index.js';
import { writeFileSync } from 'fs';

const W = 1200, H = 630;
const papel = '#FBF6EE', oro = '#A9873F', tinta = '#3A3128', suave = '#8A7C69', acento = '#C08497';

/* El sobre, centrado y un poco por encima del texto */
const sx = 470, sy = 96, sw = 260, sh = 174;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFDF9"/>
      <stop offset="100%" stop-color="#F4EADA"/>
    </linearGradient>
    <linearGradient id="solapa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E8D3AE"/>
      <stop offset="100%" stop-color="#F6ECD9"/>
    </linearGradient>
    <radialGradient id="lacre" cx="34%" cy="30%">
      <stop offset="0%" stop-color="#D9A9B7"/>
      <stop offset="100%" stop-color="${acento}"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#fondo)"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${oro}" stroke-opacity=".38" stroke-width="2" rx="10"/>

  <!-- puntitos decorativos -->
  ${[[150, 120], [1060, 150], [200, 520], [1010, 500], [120, 320], [1090, 330]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 3 : 5}" fill="${oro}" fill-opacity=".28"/>`).join('')}

  <!-- el sobre -->
  <g>
    <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="7" fill="#FFFDF9" stroke="${oro}" stroke-opacity=".45" stroke-width="2"/>
    <rect x="${sx + 18}" y="${sy - 8}" width="${sw - 36}" height="${sh - 22}" rx="4" fill="#fff" stroke="${oro}" stroke-opacity=".22"/>
    <path d="M${sx} ${sy} L${sx + sw} ${sy} L${sx + sw / 2} ${sy + sh * 0.62} Z" fill="url(#solapa)" stroke="${oro}" stroke-opacity=".4" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${sx + sw / 2}" cy="${sy + sh * 0.5}" r="30" fill="url(#lacre)"/>
    <text x="${sx + sw / 2}" y="${sy + sh * 0.5 + 12}" font-family="Georgia, serif" font-size="34" fill="#fff" text-anchor="middle">&amp;</text>
  </g>

  <!-- ornamento -->
  <g stroke="${oro}" stroke-width="1.6" fill="none" opacity=".8">
    <path d="M470 340 h80"/><path d="M650 340 h80"/>
    <path d="M566 340 c8-12 16-12 24 0 s16 12 24 0"/>
    <circle cx="558" cy="340" r="3.4" fill="${oro}" stroke="none"/>
    <circle cx="642" cy="340" r="3.4" fill="${oro}" stroke="none"/>
  </g>

  <text x="${W / 2}" y="424" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="76" fill="${tinta}" text-anchor="middle">Estás invitado</text>
  <text x="${W / 2}" y="480" font-family="'Segoe UI', Arial, sans-serif" font-size="27" fill="${suave}" text-anchor="middle">Toca para abrir tu invitación</text>
  <text x="${W / 2}" y="566" font-family="'Segoe UI', Arial, sans-serif" font-size="19" letter-spacing="5" fill="${oro}" text-anchor="middle">INVITA   ·   WEISS AI LAB</text>
</svg>`;

const salida = 'C:/Users/ASUS/Documents/Weiss-AI-Lab/Proyectos/Invita/og.png';
const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(salida, buf);
const meta = await sharp(buf).metadata();
console.log('og.png', meta.width + 'x' + meta.height, Math.round(buf.length / 1024) + ' KB');

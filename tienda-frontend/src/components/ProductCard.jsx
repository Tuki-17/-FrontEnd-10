import React from 'react';
import { API_URL } from '../services/api';

// Mapa de imágenes de demostración por tipo de producto
const PRODUCT_IMAGES = {
  hamburguesa: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  esponja:     'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
  huevo:       'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
  vela:        'https://images.unsplash.com/photo-1605197161470-5d5f2a3c7e10?w=400&q=80',
  tomate:      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  torta:       'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
  default:     'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
};

// Badge color por tipo
const BADGE_CONFIG = {
  hamburguesa: { label: '🍔 WOW!',     cls: 'tag-pink' },
  esponja:     { label: '🧽 FINA!',     cls: 'tag-cyan' },
  huevo:       { label: '🍳 FRESH!',    cls: 'tag-fresh' },
  vela:        { label: '🕯️ DARK!',    cls: 'tag-purple' },
  tomate:      { label: '🍅 LIMITED!', cls: 'tag-pink' },
  torta:       { label: '🎂 NEW!',     cls: 'tag-fresh' },
  default:     { label: '✨ COOL!',    cls: 'tag-cyan' },
};

function getKey(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('hamburguesa')) return 'hamburguesa';
  if (n.includes('esponja'))     return 'esponja';
  if (n.includes('huevo'))       return 'huevo';
  if (n.includes('vela'))        return 'vela';
  if (n.includes('tomate'))      return 'tomate';
  if (n.includes('torta'))       return 'torta';
  return 'default';
}

const ADVERTENCIAS = {
  hamburguesa: 'Dulce de banana y avena. No contiene carne.',
  esponja:     'Bizcochuelo cítrico. No es una esponja real.',
  huevo:       'Gelatina y crema pastelera. No es un huevo.',
  vela:        'Chocolate blanco y negro. No es una vela.',
  tomate:      'Alfajor de maicena premium. No es un tomate.',
  torta:       'Pastelería creativa 100% comestible.',
  default:     'Producto de pastelería trampantojo. 100% comestible.',
};

export function ProductCard({ producto, onAddToCart }) {
  const key = getKey(producto.nombre);
  const badge = BADGE_CONFIG[key];
  let imgSrc = PRODUCT_IMAGES[key];
  if (producto.imagen_url) {
    const rawUrl = producto.imagen_url.trim();
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('//') || rawUrl.startsWith('data:')) {
      imgSrc = rawUrl;
    } else {
      const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      imgSrc = `${API_URL}${cleanPath}`;
    }
  }
  const advertencia = producto.descripcion || ADVERTENCIAS[key];
  const sinStock = producto.stock <= 0;

  return (
    <div className="product-card">
      {/* Imagen con badge encima */}
      <div className="card-image-wrapper">
        <img
          src={imgSrc}
          alt={producto.nombre}
          loading="lazy"
          onError={(e) => { e.target.src = PRODUCT_IMAGES.default; }}
        />
        <span className={`card-tag ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="card-body">
        <h3 className="card-title">"{producto.nombre}"</h3>

        {/* Deber de información Art. 4 */}
        <div className="deber-informacion">
          <span>⚠️</span>
          <span>{advertencia}</span>
        </div>

        <p className="installments-info">
          {producto.cuotas_cantidad}x ${producto.cuotas_valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>

        <div className="legal-details">
          PTF: ${producto.precio_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })} | CFT: 0,00% | TNA: 0,00%
        </div>

        <div className="stock-info">
          <span>Stock: {producto.stock} u.</span>
          <span>Sujeto a disponibilidad</span>
        </div>
      </div>

      {/* Footer: precio + botón + */}
      <div className="card-footer">
        <span className="cash-price">
          ${producto.precio_final.toLocaleString('es-AR')} ARS
        </span>
        <button
          className="btn-add-circle"
          onClick={() => onAddToCart(producto)}
          disabled={sinStock}
          title={sinStock ? 'Sin stock' : 'Agregar al carrito'}
        >
          {sinStock ? '—' : '+'}
        </button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { getProductos, solicitarArrepentimiento, registerUser, checkout, loginUser, getMe } from './services/api';
import { ProductCard } from './components/ProductCard';
import { AdminPanel } from './components/AdminPanel';
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lento, setLento] = useState(false);

  // Estados del Carrito
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estados de Compra (Checkout)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [compraExitosa, setCompraExitosa] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Estados de Registro
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConsent, setRegConsent] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(null);

  // Estados de Arrepentimiento (Ley 24.240 - Res. 424/2020)
  const [isArrepentimientoOpen, setIsArrepentimientoOpen] = useState(false);
  const [arrepEmail, setArrepEmail] = useState('');
  const [arrepCodigo, setArrepCodigo] = useState('');
  const [arrepDetalle, setArrepDetalle] = useState('');
  const [revocacionTicket, setRevocacionTicket] = useState(null);
  const [arrepError, setArrepError] = useState(null);
  const [arrepLoading, setArrepLoading] = useState(false);

  // Estados de Autenticación
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    if (!loading) {
      setLento(false);
      return;
    }
    const t = setTimeout(() => setLento(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  // Cargar usuario inicial
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getMe(token)
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('access_token');
        });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getProductos()
      .then((data) => {
        setProductos(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Agregar al carrito
  const handleAddToCart = (producto) => {
    const itemExistente = cart.find((item) => item.id === producto.id);
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        toast.error(`No hay más stock disponible de ${producto.nombre}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...producto, cantidad: 1 }]);
    }
  };

  // Quitar del carrito
  const handleRemoveFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Checkout Real con API
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!checkoutEmail) {
      toast.error("Por favor ingresá tu email registrado.");
      return;
    }
    
    setCheckoutLoading(true);
    
    const itemsData = cart.map(item => ({ id: item.id, cantidad: item.cantidad }));
    
    checkout(checkoutEmail, itemsData)
      .then((data) => {
         setCompraExitosa({
           codigoCompra: data.codigo_compra,
           fecha: new Date().toLocaleString('es-AR'),
           email: checkoutEmail,
           items: [...cart],
           total: data.total,
         });
         setCart([]);
         setIsCheckoutOpen(false);
         // Opcional: Actualizar stock local sin recargar
         const nuevosProductos = productos.map((p) => {
           const itemEnCarrito = cart.find((c) => c.id === p.id);
           if (itemEnCarrito) {
             return { ...p, stock: Math.max(0, p.stock - itemEnCarrito.cantidad) };
           }
           return p;
         });
         setProductos(nuevosProductos);
      })
      .catch((err) => {
         toast.error("Error en la compra: " + err.message);
      })
      .finally(() => {
         setCheckoutLoading(false);
      });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    
    registerUser(regNombre, regEmail, regPassword, regConsent)
      .then(() => {
         setRegSuccess("¡Cuenta creada exitosamente! Ya podés realizar compras.");
         setTimeout(() => {
             setIsRegisterOpen(false);
             setRegSuccess(null);
             setRegNombre('');
             setRegEmail('');
             setRegPassword('');
             setRegConsent(false);
         }, 2500);
      })
      .catch((err) => setRegError(err.message));
  };

  // Enviar Revocación de Compra (Botón de Arrepentimiento)
  const handleArrepentimientoSubmit = (e) => {
    e.preventDefault();
    if (!arrepEmail || !arrepCodigo) {
      setArrepError("El correo electrónico y el código de compra son obligatorios.");
      return;
    }

    setArrepLoading(true);
    setArrepError(null);

    solicitarArrepentimiento(arrepEmail, arrepCodigo, arrepDetalle)
      .then((data) => {
        setRevocacionTicket(data.registro);
      })
      .catch((err) => {
        setArrepError(err.message || "Error al procesar la revocación");
      })
      .finally(() => {
        setArrepLoading(false);
      });
  };

  // Cerrar diálogos y resetear estados
  const cerrarModales = () => {
    setIsCheckoutOpen(false);
    setIsArrepentimientoOpen(false);
    setCompraExitosa(null);
    setRevocacionTicket(null);
    setArrepEmail('');
    setArrepCodigo('');
    setArrepDetalle('');
    setArrepError(null);
    setIsLoginOpen(false);
    setLoginError(null);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    loginUser(loginEmail, loginPassword)
      .then((data) => {
        localStorage.setItem('access_token', data.access_token);
        return getMe(data.access_token);
      })
      .then((userData) => {
        setUser(userData);
        setIsLoginOpen(false);
        setLoginEmail('');
        setLoginPassword('');
        toast.success(`¡Bienvenido, ${userData.nombre}!`);
      })
      .catch((err) => {
        setLoginError(err.message);
      })
      .finally(() => {
        setLoginLoading(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setCart([]);
    toast.success("Has cerrado sesión correctamente.");
  };

  const abrirRegistro = () => {
    setIsRegisterOpen(true);
    setRegError(null);
    setRegSuccess(null);
  };

  const totalCarrito = cart.reduce((sum, item) => sum + item.precio_final * item.cantidad, 0);

  return (
    <div className="app-container">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      }} />
      {/* Encabezado Principal */}
      <header className="app-header">
        <div className="brand-section">
          <h1 className="brand-title">🍰 Trampantojos Boutique</h1>
          <span className="brand-subtitle">Pastelería de ilusión óptica · Información transparente (Ley 24.240)</span>
        </div>
        <div className="nav-actions">
          {!user ? (
            <>
              <button className="btn btn-secondary" onClick={() => setIsLoginOpen(true)}>
                🔑 Iniciar Sesión
              </button>
              <button className="btn btn-secondary" onClick={abrirRegistro}>
                👤 Registrarse
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Hola, {user.nombre} ({user.rol === 'admin' ? 'Administrador' : 'Cliente'})
              </span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </>
          )}
          
          <button 
            className="btn btn-arrepentimiento" 
            onClick={() => setIsArrepentimientoOpen(true)}
            title="Botón de Arrepentimiento - Resolución 424/2020"
          >
            ↩️ Arrepentimiento
          </button>
          
          {(!user || user.rol !== 'admin') && (
            <button className="btn btn-secondary" onClick={() => setIsCartOpen(true)}>
              🛒 Carrito
              {cart.length > 0 && (
                <span className="cart-badge">
                  {cart.reduce((s, i) => s + i.cantidad, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Banner Legal */}
      <section className="info-banner">
        <h3>ℹ️ Transparencia Comercial (Ley 24.240)</h3>
        <p>
          De conformidad con el <strong>Art. 4 de la Ley 24.240</strong>, todos los precios son finales en ARS.
          Cuotas sin interés (<strong>CFT: 0,00%, TNA: 0,00%, TEA: 0,00%</strong>).
          Tenés derecho a revocar la compra dentro de los 10 días corridos usando el Botón de Arrepentimiento.
        </p>
      </section>

      {/* Vistas basadas en roles */}
      {user?.rol === 'admin' ? (
        <main style={{ flexGrow: 1, padding: '20px', background: 'var(--white)', borderRadius: 'var(--r-card)', border: 'var(--border-thick)' }}>
          <h2 className="catalogo-title">🛡️ Panel de Control Administrador</h2>
          <p style={{ marginTop: '10px' }}>Bienvenido al dashboard exclusivo para administradores.</p>
          <AdminPanel productos={productos} setProductos={setProductos} token={localStorage.getItem('access_token')} />
        </main>
      ) : user?.rol === 'customer' ? (
        <main style={{ flexGrow: 1, padding: '20px', background: 'var(--white)', borderRadius: 'var(--r-card)', border: 'var(--border-thick)', marginBottom: '20px' }}>
          <h2 className="catalogo-title">🛍️ Panel del Cliente</h2>
          <p style={{ marginTop: '10px' }}>Aquí puedes ver tu historial de pedidos, tus métodos de pago y gestionar tu cuenta.</p>
        </main>
      ) : null}

      {/* Catálogo (Solo si no es admin) */}
      {user?.rol !== 'admin' && (
        <main style={{ flexGrow: 1 }}>
          <div className="catalogo-header">
            <h2 className="catalogo-title">🍭 Nuestras Creaciones Dulces</h2>
            <div className="vibe-tags">
              <span className="badge-pill badge-lime">🍬 Sweet AF</span>
              <span className="badge-pill badge-pink">✨ Shine On</span>
              <span className="badge-pill badge-cyan">🌀 Vibe Check</span>
              <span className="badge-pill badge-yellow">⚡ Power Up</span>
            </div>
          </div>
          
          {loading && (
            <p className="loading-text">
              {lento ? "Despertando el servidor, la primera visita puede tardar un minuto…" : "Cargando productos…"}
            </p>
          )}
          {error && <div className="error-box">⚠️ Error: {error}</div>}
          
          {!loading && !error && (
            <div className="product-grid">
              {productos.map((prod) => (
                <ProductCard 
                  key={prod.id} 
                  producto={prod} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* Lateral: Carrito de Compras (Drawer) */}
      {isCartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Tu Carrito</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setIsCartOpen(false)}>✕</button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Tu carrito está vacío.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.nombre}</h4>
                      <p>{item.cantidad} x ${item.precio_final.toLocaleString('es-AR')}</p>
                    </div>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleRemoveFromCart(item.id)}>Quitar</button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-line">
                  <span>Total (Contado):</span>
                  <span>${totalCarrito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="cart-cft-disclosure">
                  Financiación: Hasta 3 cuotas sin interés | <strong>CFT: 0,00%</strong>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  💳 Iniciar Compra
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Checkout / Formulario de Compra */}
      {isCheckoutOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">💳 Completar Datos de Pago</h3>
            <p className="modal-description">De conformidad con la Ley 24.240, solicitamos sus datos para formalizar la factura comercial y el desglose regulatorio.</p>
            
            <form onSubmit={handleCheckoutSubmit}>
              <div className="form-group">
                <label className="form-label">Correo Electrónico (Registrado en su cuenta)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="juan@ejemplo.com" 
                  required 
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCheckoutOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={checkoutLoading}>
                  {checkoutLoading ? (
                    <>
                      <span className="spinner"></span> Procesando...
                    </>
                  ) : 'Confirmar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket de Compra Exitosa (Cumplimiento de información contractual) */}
      {compraExitosa && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <h3 className="modal-title" style={{ color: 'var(--success)' }}>🎉 ¡Compra Realizada con Éxito!</h3>
            <p className="modal-description">Se ha generado tu ticket fiscal simulado cumpliendo con las regulaciones de la Ley 24.240.</p>
            
            <div className="invoice-box">
              <div className="invoice-header">
                TRAMPANTOJOS BOUTIQUE S.R.L.<br />
                FACTURA SIMULADA DE CONSUMO<br />
                -------------------------------------
              </div>
              <div>Fecha: {compraExitosa.fecha}</div>
              <div>Código de Compra: <strong>{compraExitosa.codigoCompra}</strong></div>
              <div>Email (Usuario): {compraExitosa.email}</div>
              <div>-------------------------------------</div>
              <div style={{ fontWeight: 'bold', margin: '4px 0' }}>Detalle de Productos:</div>
              {compraExitosa.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between' }}>
                  <span>{item.nombre} (x{item.cantidad})</span>
                  <span>${(item.precio_final * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div>-------------------------------------</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span>PRECIO TOTAL FINANCIADO:</span>
                <span>${compraExitosa.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                * Financiación: 3 cuotas sin interés.<br />
                * Costo Financiero Total (CFT): 0,00% | TNA: 0,00%<br />
                * Derecho de Revocación (Art. 34 Ley 24.240): Usted dispone de 10 días corridos para revocar esta compra desde la fecha de recepción, ingresando al Botón de Arrepentimiento en nuestra web con su código de compra y correo.
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={cerrarModales}>Entendido / Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Botón de Arrepentimiento (Resolución 424/2020) */}
      {isArrepentimientoOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">↩️ Botón de Arrepentimiento</h3>
            <p className="modal-description">
              De acuerdo con la <strong>Resolución 424/2020</strong>, usted puede revocar la aceptación del contrato de compra dentro de los 10 días corridos de haber realizado el pedido.
            </p>

            {!revocacionTicket ? (
              <form onSubmit={handleArrepentimientoSubmit}>
                {arrepError && (
                  <p style={{ color: 'var(--danger)', fontSize: '13px', background: 'var(--danger-light)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                    {arrepError}
                  </p>
                )}

                <div className="form-group">
                  <label className="form-label">Correo Electrónico de Compra</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="ejemplo@correo.com" 
                    required
                    value={arrepEmail}
                    onChange={(e) => setArrepEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código de Compra (ej. CMP-123456)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="CMP-XXXXXX" 
                    required
                    value={arrepCodigo}
                    onChange={(e) => setArrepCodigo(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo (Opcional)</label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Detalle brevemente el motivo..."
                    value={arrepDetalle}
                    onChange={(e) => setArrepDetalle(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={cerrarModales} disabled={arrepLoading}>Cerrar</button>
                  <button type="submit" className="btn btn-arrepentimiento" disabled={arrepLoading}>
                    {arrepLoading ? 'Procesando...' : 'Confirmar Revocación'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong style={{ color: 'var(--success)' }}>✔ Trámite de Revocación Iniciado.</strong> El backend ha registrado su solicitud correctamente.</p>
                
                <div className="ticket-container">
                  <div className="ticket-row">
                    <span>CÓDIGO DE TRÁMITE:</span>
                    <strong>{revocacionTicket.codigo_tramite}</strong>
                  </div>
                  <div className="ticket-row">
                    <span>CORREO:</span>
                    <span>{revocacionTicket.email}</span>
                  </div>
                  <div className="ticket-row">
                    <span>CÓDIGO COMPRA:</span>
                    <span>{revocacionTicket.codigo_compra}</span>
                  </div>
                  <div className="ticket-row">
                    <span>FECHA SOLICITUD:</span>
                    <span>{revocacionTicket.fecha}</span>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                  De acuerdo con el Art. 34 de la Ley 24.240 y la Res. 424/2020, el proveedor no podrá cobrarle ningún cargo adicional ni penalidad por el ejercicio de este derecho. Conserve este código de trámite como comprobante.
                </p>

                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={cerrarModales}>Cerrar Ventana</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Inicio de Sesión */}
      {isLoginOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">🔑 Iniciar Sesión</h3>
            <p className="modal-description">Ingresa tus credenciales para acceder a tu cuenta.</p>
            
            <form onSubmit={handleLoginSubmit}>
              {loginError && (
                <p style={{ color: 'var(--danger)', fontSize: '13px', background: 'var(--danger-light)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                  {loginError}
                </p>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="correo@ejemplo.com" 
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="******" 
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsLoginOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loginLoading}>
                  {loginLoading ? <><span className="spinner"></span> Verificando...</> : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registro */}
      {isRegisterOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">👤 Crear Cuenta</h3>
            <p className="modal-description">Regístrese para poder realizar compras.</p>
            
            {regSuccess ? (
               <div style={{ color: 'var(--success)', padding: '10px', fontWeight: 'bold' }}>
                  {regSuccess}
               </div>
            ) : (
               <form onSubmit={handleRegisterSubmit}>
                 {regError && (
                   <p style={{ color: 'var(--danger)', fontSize: '13px', background: 'var(--danger-light)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                     {regError}
                   </p>
                 )}

                 <div className="form-group">
                   <label className="form-label">Nombre</label>
                   <input 
                     type="text" 
                     className="form-input" 
                     placeholder="Tu nombre" 
                     required
                     value={regNombre}
                     onChange={(e) => setRegNombre(e.target.value)}
                   />
                 </div>

                 <div className="form-group">
                   <label className="form-label">Email</label>
                   <input 
                     type="email" 
                     className="form-input" 
                     placeholder="correo@ejemplo.com" 
                     required
                     value={regEmail}
                     onChange={(e) => setRegEmail(e.target.value)}
                   />
                 </div>

                 <div className="form-group">
                   <label className="form-label">Contraseña</label>
                   <input 
                     type="password" 
                     className="form-input" 
                     placeholder="******" 
                     required
                     value={regPassword}
                     onChange={(e) => setRegPassword(e.target.value)}
                   />
                 </div>

                 <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <input 
                     type="checkbox" 
                     id="consentimiento" 
                     checked={regConsent}
                     onChange={(e) => setRegConsent(e.target.checked)}
                   />
                   <label htmlFor="consentimiento" style={{ fontSize: '13px' }}>Acepto el tratamiento de mis datos personales según la Ley 25.326</label>
                 </div>

                 <div className="modal-actions">
                   <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterOpen(false)}>Cancelar</button>
                   <button type="submit" className="btn btn-primary" disabled={!regConsent}>
                     Crear Cuenta
                   </button>
                 </div>
               </form>
            )}
          </div>
        </div>
      )}

      {/* Pie de Página Legal Obligatorio en Argentina */}
      <footer className="app-footer">
        <div className="footer-compliance-links">
          <a 
            href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="defensa-consumidor-logo"
            id="defensa-consumidor-btn"
          >
            <span>⚖️ Defensa del Consumidor</span>
          </a>
        </div>
        <p className="footer-legal-text">
          Dirección General de Defensa y Protección al Consumidor. Para consultas y/o denuncias ingrese aquí. 
          Los precios indicados son en Pesos Argentinos e incluyen IVA. Toda oferta publicada en el sitio está sujeta a disponibilidad de stock. 
          Las imágenes son meramente ilustrativas y corresponden a productos de pastelería trampantojo. 
          © 2026 Trampantojos Boutique S.R.L. - Todos los derechos reservados.
        </p>
      </footer>
      
    </div>
  );
}
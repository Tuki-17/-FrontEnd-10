import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Producto as ProductoModel
from app.routers import productos
from app.routers import auth
from app.routers import pedidos

# Crear las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

# Carga inicial de productos (seeding) si la base de datos está vacía
db = SessionLocal()
try:
    if db.query(ProductoModel).count() == 0:
        productos_defecto = [
            ProductoModel(nombre="Hamburguesa (Banana y avena)", precio_final=9500.0, cuotas_cantidad=3, cuotas_valor=3166.67, garantia_meses=0, stock=15),
            ProductoModel(nombre="Esponja (Bizcochuelo)", precio_final=12500.0, cuotas_cantidad=3, cuotas_valor=4166.67, garantia_meses=0, stock=10),
            ProductoModel(nombre="Huevo (Gelatina)", precio_final=6000.0, cuotas_cantidad=1, cuotas_valor=6000.0, garantia_meses=0, stock=20),
            ProductoModel(nombre="Vela (Chocolate blanco y negro)", precio_final=9000.0, cuotas_cantidad=3, cuotas_valor=3000.0, garantia_meses=0, stock=12),
            ProductoModel(nombre="Tomate (Alfajor de maicena)", precio_final=11000.0, cuotas_cantidad=3, cuotas_valor=3666.67, garantia_meses=0, stock=18),
        ]
        db.bulk_save_objects(productos_defecto)
        db.commit()
        print("Base de datos inicializada y poblada con productos por defecto.")
except Exception as e:
    print(f"Error al poblar la base de datos: {e}")
finally:
    db.close()

app = FastAPI(title=settings.PROJECT_NAME)

# Middleware de CORS para permitir peticiones del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar los routers
app.include_router(productos.router)
app.include_router(auth.router)
app.include_router(pedidos.router)


# --- Endpoint de arrepentimiento (Resolución 424/2020) ---

class SolicitudArrepentimiento(BaseModel):
    email: str
    codigo_compra: str
    detalle: str | None = None

from app.models import Pedido, ItemPedido
from app.dependencies import get_db
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

@app.post("/arrepentimiento")
def registrar_arrepentimiento(solicitud: SolicitudArrepentimiento, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.codigo_compra == solicitud.codigo_compra).first()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado con ese código de compra.")
    
    # Check if email matches (security check)
    if pedido.usuario.email != solicitud.email:
        raise HTTPException(status_code=400, detail="El correo no coincide con el pedido.")

    if pedido.estado == "CANCELADO":
        raise HTTPException(status_code=400, detail="Este pedido ya se encuentra cancelado.")
    
    pedido.estado = "CANCELADO"
    
    for item in pedido.items:
        producto = item.producto
        if producto:
            producto.stock += item.cantidad
            
    codigo_tramite = f"REV-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    db.commit()
    
    return {
        "mensaje": "Trámite de revocación de compra iniciado con éxito (Resolución 424/2020).",
        "codigo_tramite": codigo_tramite,
        "registro": {
            "email": solicitud.email,
            "codigo_compra": solicitud.codigo_compra,
            "codigo_tramite": codigo_tramite,
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    }


@app.get("/")
def raiz():
    return {"status": "ok", "app": settings.PROJECT_NAME}
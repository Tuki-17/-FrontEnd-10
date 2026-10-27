"""
Servicio de Productos.
Contiene toda la logica de negocio relacionada con productos,
manteniendo los routers limpios y desacoplados de la base de datos.
"""

from sqlalchemy.orm import Session
from app.models import Producto as ProductoModel
from app import schemas


def crear_producto(db: Session, producto: schemas.ProductoCreate) -> ProductoModel:
    """
    Crea un nuevo producto en la base de datos.

    Args:
        db: Sesion activa de SQLAlchemy.
        producto: Datos validados del producto a crear (sin id).

    Returns:
        El producto recien creado con su id asignado.
    """
    nuevo = ProductoModel(**producto.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


def listar_productos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    nombre: str | None = None,
    precio_max: float | None = None,
) -> list[ProductoModel]:
    """
    Lista productos con paginacion y filtros opcionales.

    Args:
        db: Sesion activa de SQLAlchemy.
        skip: Cantidad de registros a saltar (offset para paginacion).
        limit: Cantidad maxima de registros a devolver.
        nombre: Filtro parcial por nombre (case-insensitive). Si es None, no filtra.
        precio_max: Precio maximo inclusive. Si es None, no filtra.

    Returns:
        Lista de productos que cumplen los criterios.
    """
    query = db.query(ProductoModel)

    if nombre is not None:
        # LIKE case-insensitive: ilike es especifico de PostgreSQL/SQLAlchemy
        query = query.filter(ProductoModel.nombre.ilike(f"%{nombre}%"))

    if precio_max is not None:
        query = query.filter(ProductoModel.precio_final <= precio_max)

    return query.offset(skip).limit(limit).all()


def actualizar_producto(
    db: Session, producto_id: int, producto_update: schemas.ProductoUpdate
) -> ProductoModel:
    db_producto = db.query(ProductoModel).filter(ProductoModel.id == producto_id).first()
    if not db_producto:
        return None
    
    update_data = producto_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_producto, key, value)
        
    db.commit()
    db.refresh(db_producto)
    return db_producto

from pydantic import BaseModel


class ProductoCreate(BaseModel):
    """Schema para crear un producto. No incluye el id (lo asigna la DB)."""
    nombre: str
    precio_final: float
    cuotas_cantidad: int
    cuotas_valor: float
    garantia_meses: int
    stock: int
    imagen_url: str | None = None
    descripcion: str | None = None


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    precio_final: float | None = None
    cuotas_cantidad: int | None = None
    cuotas_valor: float | None = None
    garantia_meses: int | None = None
    stock: int | None = None
    imagen_url: str | None = None
    descripcion: str | None = None


class ProductoOut(ProductoCreate):
    """Schema de salida. Hereda todos los campos de ProductoCreate y agrega el id."""
    id: int

    class Config:
        from_attributes = True  # Permite convertir objetos ORM a Pydantic

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, default="customer")
    acepto_tratamiento = Column(Boolean, nullable=False, default=False)
    fecha_consentimiento = Column(DateTime, nullable=True)

    pedidos = relationship("Pedido", back_populates="usuario")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    precio_final = Column(Float, nullable=False)
    cuotas_cantidad = Column(Integer, nullable=False)
    cuotas_valor = Column(Float, nullable=False)
    garantia_meses = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=False)
    imagen_url = Column(String, nullable=True)
    descripcion = Column(String, nullable=True)

    items = relationship("ItemPedido", back_populates="producto")

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    codigo_compra = Column(String, unique=True, index=True, nullable=False)
    estado = Column(String, default="pendiente")
    total = Column(Float, nullable=False)

    usuario = relationship("Usuario", back_populates="pedidos")
    items = relationship("ItemPedido", back_populates="pedido")

class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="items")
    producto = relationship("Producto", back_populates="items")
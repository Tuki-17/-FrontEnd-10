import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Producto, Pedido, ItemPedido, Usuario
from app.schemas.pedido import CheckoutRequest

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

@router.post("/checkout")
def checkout(request: CheckoutRequest, db: Session = Depends(get_db)):
    try:
        usuario = db.query(Usuario).filter(Usuario.email == request.email).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo no está registrado. Creá una cuenta antes de comprar"
            )

        if not request.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El carrito está vacío.")

        nuevo_pedido = Pedido(
            usuario_id=usuario.id,
            codigo_compra=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            estado="pendiente",
            total=0.0
        )
        db.add(nuevo_pedido)
        db.flush()

        total = 0.0
        for item in request.items:
            producto = db.query(Producto).filter(Producto.id == item.id).with_for_update().first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto con id {item.id} no encontrado.")
            
            if producto.stock < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para '{producto.nombre}'. Disponibles: {producto.stock}."
                )
            
            producto.stock -= item.cantidad
            
            item_pedido = ItemPedido(
                pedido_id=nuevo_pedido.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio_final
            )
            db.add(item_pedido)
            total += producto.precio_final * item.cantidad

        nuevo_pedido.total = total
        db.commit()
        db.refresh(nuevo_pedido)
        
        return {
            "codigo_compra": nuevo_pedido.codigo_compra,
            "total": nuevo_pedido.total,
            "mensaje": "Compra exitosa."
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

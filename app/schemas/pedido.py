from pydantic import BaseModel

class ItemPedidoCreate(BaseModel):
    id: int
    cantidad: int

class CheckoutRequest(BaseModel):
    email: str
    items: list[ItemPedidoCreate]

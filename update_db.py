import os
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.core.security import hash_password
from app.models import Usuario

def update_db():
    print("Updating schema...")
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE productos ADD COLUMN imagen_url VARCHAR"))
            print("Added imagen_url")
        except Exception as e:
            print("imagen_url might already exist:", e)

        try:
            conn.execute(text("ALTER TABLE productos ADD COLUMN descripcion VARCHAR"))
            print("Added descripcion")
        except Exception as e:
            print("descripcion might already exist:", e)

    print("Creating admin user...")
    db = SessionLocal()
    admin = db.query(Usuario).filter(Usuario.email == "iancastromars17@gmail.com").first()
    if not admin:
        hashed = hash_password("ian123")
        admin = Usuario(
            nombre="Administrador",
            email="iancastromars17@gmail.com",
            hashed_password=hashed,
            rol="admin",
            acepto_tratamiento=True
        )
        db.add(admin)
        db.commit()
        print("Admin user created.")
    else:
        admin.rol = "admin"
        db.commit()
        print("Admin user already exists, ensured rol=admin.")
    db.close()

if __name__ == "__main__":
    update_db()

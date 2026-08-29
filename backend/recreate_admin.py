# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

import os
import bcrypt
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def main():
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        with conn.begin():
            # hash password 'admin'
            pwd = get_password_hash("admin")
            query = text("""
                UPDATE users SET password = :pwd, is_super_admin = true, is_admin = true 
                WHERE username = 'admin'
            """)
            res = conn.execute(query, {"pwd": pwd})
            if res.rowcount > 0:
                print("Admin user updated successfully. Password reset to 'admin'.")
            else:
                print("Admin user not found to update.")

if __name__ == "__main__":
    main()

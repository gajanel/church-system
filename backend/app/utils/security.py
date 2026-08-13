from passlib.context import CryptContext

# Usamos pbkdf2_sha256 por defecto, pero mantenemos bcrypt para compatibilidad con hashes existentes
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
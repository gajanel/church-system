# Imagen base de Python ligera
FROM python:3.10-slim

# Evitar que Python genere archivos .pyc y permitir logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias (para psycopg2 y otros)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Crear carpetas para archivos estáticos si no existen
RUN mkdir -p static/members static/uploads/deposits

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando para arrancar con Uvicorn (modo producción)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

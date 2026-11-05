# Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
# Este código es confidencial y propietario. No está permitida su distribución ni modificación.

from pydantic import BaseModel


class OfferingTypeCreate(BaseModel):

    name: str
    description: str | None = None
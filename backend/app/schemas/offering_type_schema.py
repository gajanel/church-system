from pydantic import BaseModel


class OfferingTypeCreate(BaseModel):

    name: str
    description: str | None = None
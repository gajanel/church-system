from pydantic import BaseModel

class MemberMinistryAssign(BaseModel):
    ministry_id: int
    ministry_role_id: int

class MemberMinistryResponse(BaseModel):
    id: int
    ministry_id: int
    ministry_name: str
    role: str

    class Config:
        from_attributes = True
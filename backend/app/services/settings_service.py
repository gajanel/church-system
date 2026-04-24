from sqlalchemy.orm import Session
from app.models.settings_model import Settings
from app.schemas.settings_schema import SettingsUpdate

def get_settings(db: Session):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def update_settings(db: Session, data: SettingsUpdate):
    settings = get_settings(db)
    # Solo actualizar los campos que vienen explícitamente en el payload
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:  # No sobrescribir con None
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

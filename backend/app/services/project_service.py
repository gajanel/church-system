from sqlalchemy.orm import Session
from app.models.project_model import Project
from app.schemas.project_schema import ProjectCreate, ProjectUpdate


def get_all_projects(db: Session):
    return db.query(Project).order_by(Project.created_at.desc()).all()


def get_project_by_id(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, data: ProjectCreate):
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: int, data: dict):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True


def get_projects_summary(db: Session):
    projects = db.query(Project).all()
    return {
        "total": len(projects),
        "total_budget": sum(p.budget for p in projects),
        "total_contributions": sum(p.contributions for p in projects),
        "total_spent": sum(p.spent for p in projects),
    }

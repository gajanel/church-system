from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.strategic_plan_model import StrategicPlanArea
from app.schemas.strategic_plan_schema import StrategicPlanAreaResponse, StrategicPlanAreaUpdate
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/strategic-plan", tags=["Plan Estratégico"])

DEFAULT_AREAS = [
    {
        "area_id": 1,
        "name": "GRAN COMISIÓN",
        "responsible": "Líder de Misiones",
        "indicators": {
            "current_members": {"actual": 0, "meta": 100},
            "projected_members": {"actual": 0, "meta": 200},
            "planted_churches": {"actual": 0, "meta": 5},
            "active_missionary_projects": {"actual": 0, "meta": 2}
        },
        "commitments": {
            "intercession": "NO",
            "send_workers": "NO",
            "adopt_missionaries": "NO",
            "sponsor_projects": "NO"
        }
    },
    {
        "area_id": 2,
        "name": "FORMACIÓN INTEGRAL",
        "responsible": "Líder de Educación Cristiana",
        "indicators": {
            "idec_graduates": {"actual": 0, "meta": 50},
            "supported_leaders": {"actual": 0, "meta": 20},
            "trained_teachers": {"actual": 0, "meta": 15},
            "available_classrooms": {"actual": 0, "meta": 5}
        },
        "commitments": {
            "implemented_program": "NO",
            "approved_curriculum": "NO",
            "periodic_evaluations": "NO"
        }
    },
    {
        "area_id": 3,
        "name": "FORMACIÓN POR COMPETENCIAS",
        "responsible": "Líder de Formación y Tecnología",
        "indicators": {
            "trained_leaders": {"actual": 0, "meta": 30},
            "new_ministers": {"actual": 0, "meta": 10},
            "active_assistants": {"actual": 0, "meta": 15}
        },
        "commitments": {
            "transition_plan": "NO",
            "website_active": "NO",
            "social_media": "NO",
            "streaming_platform": "NO",
            "digital_membership": "NO"
        }
    },
    {
        "area_id": 4,
        "name": "DESARROLLO INTEGRAL DE LA FAMILIA",
        "responsible": "Líder de Familias",
        "indicators": {
            "attended_children": {"actual": 0, "meta": 100},
            "attended_youth": {"actual": 0, "meta": 80},
            "trained_youth": {"actual": 0, "meta": 40},
            "active_adults": {"actual": 0, "meta": 150},
            "trained_adults": {"actual": 0, "meta": 50},
            "men_integral_mission": {"actual": 0, "meta": 40},
            "women_integral_mission": {"actual": 0, "meta": 60}
        },
        "commitments": {
            "children_program": "NO",
            "youth_ministry": "NO",
            "marriage_program": "NO",
            "elderly_group": "NO"
        }
    },
    {
        "area_id": 5,
        "name": "INCIDENCIA PÚBLICA Y SOCIAL",
        "responsible": "Líder de Incidencia Social",
        "indicators": {
            "specialized_leaders": {"actual": 0, "meta": 10},
            "active_social_projects": {"actual": 0, "meta": 3},
            "benefited_people": {"actual": 0, "meta": 500}
        },
        "commitments": {
            "transformation_program": "NO",
            "gov_active_leader": "NO",
            "social_active_leader": "NO",
            "formalized_alliances": "NO"
        }
    },
    {
        "area_id": 6,
        "name": "CAPELLANÍA Y DESARROLLO MINISTERIAL",
        "responsible": "Junta Directiva / Concilio",
        "indicators": {
            "active_chaplains": {"actual": 0, "meta": 5},
            "chaplains_in_training": {"actual": 0, "meta": 10}
        },
        "commitments": {
            "pastoral_care_plan": "NO",
            "weekly_rest": "NO",
            "annual_vacations": "NO",
            "adequate_housing": "NO",
            "study_conditions": "NO",
            "welfare_fund": "NO"
        }
    }
]

def initialize_areas(db: Session):
    existing = db.query(StrategicPlanArea).count()
    if existing == 0:
        for area_data in DEFAULT_AREAS:
            area = StrategicPlanArea(
                area_id=area_data["area_id"],
                name=area_data["name"],
                responsible=area_data["responsible"]
            )
            area.indicators = area_data["indicators"]
            area.commitments = area_data["commitments"]
            db.add(area)
        db.commit()

@router.get("/", response_model=List[StrategicPlanAreaResponse])
def get_strategic_plan(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    initialize_areas(db)
    areas = db.query(StrategicPlanArea).order_by(StrategicPlanArea.area_id).all()
    res = []
    for a in areas:
        res.append({
            "id": a.id,
            "area_id": a.area_id,
            "name": a.name,
            "responsible": a.responsible,
            "indicators": a.indicators,
            "commitments": a.commitments
        })
    return res

@router.put("/{area_id}", response_model=StrategicPlanAreaResponse)
def update_strategic_plan_area(
    area_id: int, 
    data: StrategicPlanAreaUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    area = db.query(StrategicPlanArea).filter(StrategicPlanArea.area_id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    if data.indicators is not None:
        area.indicators = data.indicators
    if data.commitments is not None:
        area.commitments = data.commitments
        
    db.commit()
    db.refresh(area)
    return {
        "id": area.id,
        "area_id": area.area_id,
        "name": area.name,
        "responsible": area.responsible,
        "indicators": area.indicators,
        "commitments": area.commitments
    }

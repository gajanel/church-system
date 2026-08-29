/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getStrategicPlan, updateStrategicPlanArea } from "../api/strategicPlan";
import styles from "./StrategicPlan.module.css";
import { CircularProgress } from "@mui/material";

const START_DATE = new Date("2023-01-01T00:00:00");
const TOTAL_DAYS = 3652;

const calculateTimeStats = () => {
  const today = new Date();
  const elapsed = Math.max(0, Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24)));
  const remaining = Math.max(0, TOTAL_DAYS - elapsed);
  const percent = Math.min(100, (elapsed / TOTAL_DAYS) * 100);
  const years = Math.floor(remaining / 365.25);
  const months = Math.floor((remaining % 365.25) / 30.44);
  
  return { elapsed, remaining, percent, years, months };
};

const getStatusInfo = (percent) => {
  if (percent >= 100) return { label: "✔ Completado", className: styles.statusCompleted };
  if (percent >= 70) return { label: "● En curso", className: styles.statusOngoing };
  if (percent >= 40) return { label: "● En progreso", className: styles.statusProgress };
  return { label: "● Inicio", className: styles.statusStart };
};

const getPastoralMessage = (progress, timePercent) => {
  if (progress >= timePercent) {
    return "¡Excelente trabajo! Vamos a buen ritmo cumpliendo la visión que Dios nos ha dado. Sigamos esforzándonos con fe y dedicación.";
  } else {
    return "Amado líder, notamos que vamos un poco rezagados respecto al calendario. Te animamos a revisar las estrategias y confiar en que, con la guía del Señor, alcanzaremos estas metas.";
  }
};

const calculateAreaProgress = (indicators, commitments) => {
  let totalPercent = 0;
  let count = 0;

  // Indicators
  if (indicators) {
    Object.values(indicators).forEach(ind => {
      const p = Math.min(100, ((ind.actual || 0) / (ind.meta || 1)) * 100);
      totalPercent += p;
      count++;
    });
  }

  // Commitments
  if (commitments) {
    Object.values(commitments).forEach(val => {
      if (val === "SÍ") totalPercent += 100;
      else if (val === "PARCIAL") totalPercent += 50;
      // NO = 0%
      count++;
    });
  }

  return count > 0 ? (totalPercent / count) : 0;
};

const AREA_LABELS = {
  // Area 1
  "current_members": "Miembros actuales de la iglesia",
  "projected_members": "Miembros proyectados al 2033",
  "planted_churches": "Iglesias hijas plantadas (acumulado)",
  "active_missionary_projects": "Proyectos misioneros transculturales activos",
  "intercession": "Intercesión sistemática por las misiones",
  "send_workers": "Envío de obreros al campo misionero",
  "adopt_missionaries": "Adopción de misioneros en pueblos no alcanzados",
  "sponsor_projects": "Patrocinio de proyectos misioneros específicos",
  // Area 2
  "idec_graduates": "Líderes graduados de programa formal IDEC",
  "supported_leaders": "Líderes apoyados para graduarse",
  "trained_teachers": "Maestros capacitados en Educación Cristiana",
  "available_classrooms": "Aulas / salones disponibles para Ed. Cristiana",
  "implemented_program": "Programa oficial de Ed. Cristiana Integral implementado",
  "approved_curriculum": "Currículo sistemático aprobado y en uso",
  "periodic_evaluations": "Evaluaciones periódicas del programa realizadas",
  // Area 3
  "trained_leaders": "Líderes entrenados en competencias específicas",
  "new_ministers": "Nuevos ministros formados (acumulado)",
  "active_assistants": "Pastores / ministros asistentes activos",
  "transition_plan": "Plan de transición ministerial documentado",
  "website_active": "Sitio web institucional activo",
  "social_media": "Redes sociales con publicación regular",
  "streaming_platform": "Plataforma de streaming / transmisión en vivo",
  "digital_membership": "Sistema de gestión de membresía digital",
  // Area 4
  "attended_children": "Niños y pre-juveniles atendidos",
  "attended_youth": "Jóvenes atendidos",
  "trained_youth": "Jóvenes capacitados para compartir su fe",
  "active_adults": "Adultos (mujeres + hombres + matrimonios) activos",
  "trained_adults": "Adultos capacitados para liderar / mentorear",
  "men_integral_mission": "Hombres involucrados en Misión Integral",
  "women_integral_mission": "Mujeres involucradas en Misión Integral",
  "children_program": "Programa de niñez y adolescencia estructurado",
  "youth_ministry": "Ministerio de jóvenes con liderazgo propio",
  "marriage_program": "Programa de matrimonios activo",
  "elderly_group": "Grupo de adultos mayores atendido",
  // Area 5
  "specialized_leaders": "Líderes especializados en desarrollo sociocultural",
  "active_social_projects": "Proyectos sociales activos en la comunidad",
  "benefited_people": "Personas beneficiadas por proyectos sociales",
  "transformation_program": "Programa de transformación sociocultural implementado",
  "gov_active_leader": "Líder activo en el ámbito gubernamental",
  "social_active_leader": "Líder activo en lo social / comunitario",
  "formalized_alliances": "Alianzas con organizaciones externas formalizadas",
  // Area 6
  "active_chaplains": "Capellanes activos en instituciones",
  "chaplains_in_training": "Capellanes en formación / proyectados",
  "pastoral_care_plan": "Plan de cuidado pastoral formalizado por escrito",
  "weekly_rest": "Día de descanso semanal garantizado al pastor",
  "annual_vacations": "Vacaciones anuales (mínimo 15 días) garantizadas",
  "adequate_housing": "Privacidad y vivienda adecuada para familia pastoral",
  "study_conditions": "Condiciones para que el pastor estudie y se actualice",
  "welfare_fund": "Fondo de bienestar pastoral establecido"
};

/* ══════════════════════════════════════════════════════════════
   Gauge Chart SVG
   ══════════════════════════════════════════════════════════════ */
function Gauge({ percent }) {
  const R = 36, sw = 8, C = 2 * Math.PI * R;
  const offset = C - (percent / 100) * C;
  
  return (
    <svg width="90" height="90" viewBox="0 0 100 100" style={{ overflow: "visible" }}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border-color)" strokeWidth={sw} />
      <circle
          cx="50" cy="50" r={R} fill="none" stroke="var(--primary-color)" strokeWidth={sw}
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="50" y="56" textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--text-primary)">
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   Bar Chart SVG
   ══════════════════════════════════════════════════════════════ */
function PlanBarChart({ areasData }) {
  return (
    <div className={styles.barChartContainer}>
      <h3 className={styles.chartTitle}>Comparativa de Progreso por Área</h3>
      <div className={styles.barChartWrapper}>
        {areasData.map((d, i) => {
          const pct = Math.max(d.value, 2);
          return (
            <div key={i} className={styles.barColumn}>
               <span className={styles.barValue}>{d.value.toFixed(0)}%</span>
               <div className={styles.barTrack}>
                 <div className={styles.barFill} style={{ height: `${pct}%` }} />
               </div>
               <span className={styles.barLabel}>Área {d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StrategicPlan() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeAreaId, setActiveAreaId] = useState(1);
  const [view, setView] = useState('overview'); // 'overview' | 'editor'
  const timeStats = calculateTimeStats();

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await getStrategicPlan();
      setAreas(res.data);
      const initialForm = {};
      res.data.forEach(a => {
        initialForm[a.area_id] = {
          indicators: JSON.parse(JSON.stringify(a.indicators)),
          commitments: JSON.parse(JSON.stringify(a.commitments))
        };
      });
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIndicatorChange = (areaId, key, val) => {
    setFormData(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        indicators: {
          ...prev[areaId].indicators,
          [key]: { ...prev[areaId].indicators[key], actual: Number(val) }
        }
      }
    }));
  };

  const handleCommitmentChange = (areaId, key, val) => {
    setFormData(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        commitments: {
          ...prev[areaId].commitments,
          [key]: val
        }
      }
    }));
  };

  const saveArea = async (areaId) => {
    setSaving(areaId);
    try {
      await updateStrategicPlanArea(areaId, formData[areaId]);
      await fetchPlan();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10%' }}><CircularProgress /></div>;
  }

  const overallProgress = areas.length > 0 
    ? areas.reduce((acc, curr) => {
        const form = formData[curr.area_id];
        if (!form) return acc;
        return acc + calculateAreaProgress(form.indicators, form.commitments);
      }, 0) / areas.length 
    : 0;

  return (
    <div className={styles.appContainer}>
      {/* Hero Header */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Plan Estratégico 2033</h1>
          <p className={styles.heroSubtitle}>Visión y seguimiento a una década de ministerio</p>
          
          <div className={styles.heroStats}>
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>Progreso General</span>
              <span className={styles.statBoxValue}>{overallProgress.toFixed(1)}%</span>
            </div>
            <div className={styles.statBoxDivider} />
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>Tiempo Transcurrido</span>
              <span className={styles.statBoxValue}>{timeStats.percent.toFixed(1)}%</span>
            </div>
            <div className={styles.statBoxDivider} />
            <div className={styles.statBox}>
              <span className={styles.statBoxLabel}>Faltan</span>
              <span className={styles.statBoxValue}>{timeStats.years} años</span>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className={styles.viewSwitcher}>
          <button 
            className={`${styles.switchBtn} ${view === 'overview' ? styles.switchBtnActive : ''}`}
            onClick={() => setView('overview')}
          >
            Vista Global
          </button>
          <button 
            className={`${styles.switchBtn} ${view === 'editor' ? styles.switchBtnActive : ''}`}
            onClick={() => setView('editor')}
          >
            Actualizar Datos
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* OVERVIEW BENTO DASHBOARD */}
        {view === 'overview' && (
          <div className={styles.bentoGrid}>
            <div className={styles.bentoHero}>
              <PlanBarChart 
                areasData={areas.map(a => ({
                  label: a.area_id,
                  title: a.name,
                  value: calculateAreaProgress((formData[a.area_id] || a).indicators, (formData[a.area_id] || a).commitments)
                }))} 
              />
            </div>

            {areas.map(area => {
              const form = formData[area.area_id] || area;
              const progress = calculateAreaProgress(form.indicators, form.commitments);
              const status = getStatusInfo(progress);

              return (
                <div key={area.area_id} className={styles.bentoCard}>
                  <div className={styles.bentoWatermark}>0{area.area_id}</div>
                  <div className={styles.bentoCardContent}>
                    <div className={styles.bentoCardHeader}>
                      <h3 className={styles.bentoCardTitle}>{area.name}</h3>
                      <span className={styles.bentoCardBadge}>{status.label.split(' ')[1]}</span>
                    </div>
                    
                    <div className={styles.bentoProgressWrap}>
                      <div className={styles.bentoProgressHeader}>
                        <span>Avance del área</span>
                        <span className={styles.bentoProgressValue}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className={styles.bentoProgressBar}>
                        <div className={styles.bentoProgressFill} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className={styles.bentoMessage}>
                      {getPastoralMessage(progress, timeStats.percent)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* EDITOR VIEW WITH SIDEBAR */}
        {view === 'editor' && (
          <div className={styles.editorLayout}>
            {/* Sidebar */}
            <div className={styles.editorSidebar}>
              <div className={styles.sidebarTitle}>Áreas del Plan</div>
              {areas.map(area => {
                const form = formData[area.area_id];
                const progress = form ? calculateAreaProgress(form.indicators, form.commitments) : 0;
                const isActive = activeAreaId === area.area_id;
                return (
                  <button 
                    key={area.area_id}
                    className={`${styles.sidebarNavBtn} ${isActive ? styles.sidebarNavActive : ''}`}
                    onClick={() => setActiveAreaId(area.area_id)}
                  >
                    <div className={styles.navBtnHeader}>
                      <span className={styles.navBtnTitle}>0{area.area_id}. {area.name}</span>
                    </div>
                    <div className={styles.navBtnProgress}>
                      <div className={styles.navBtnBar}>
                        <div className={styles.navBtnFill} style={{ width: `${progress}%` }} />
                      </div>
                      <span className={styles.navBtnPct}>{progress.toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Form Area */}
            <div className={styles.editorContent}>
              {areas.filter(a => a.area_id === activeAreaId).map(area => {
                const form = formData[area.area_id];
                if (!form) return null;

                return (
                  <div key={area.area_id} className={styles.formContainer}>
                    <div className={styles.formHeader}>
                      <h2>{area.name}</h2>
                      <p>Responsable: <strong>{area.responsible}</strong></p>
                    </div>

                    {Object.keys(form.indicators || {}).length > 0 && (
                      <div className={styles.formSection}>
                        <h3 className={styles.sectionHeading}>Metas Numéricas</h3>
                        <div className={styles.inputGrid}>
                          {Object.entries(form.indicators).map(([key, data]) => {
                            const indPercent = Math.min(100, ((data.actual || 0) / (data.meta || 1)) * 100);
                            return (
                              <div key={key} className={styles.inputCard}>
                                <label className={styles.inputLabel}>{AREA_LABELS[key] || key}</label>
                                <div className={styles.inputWrapper}>
                                  <input 
                                    type="number" 
                                    className={styles.elegantInput}
                                    value={data.actual} 
                                    onChange={(e) => handleIndicatorChange(area.area_id, key, e.target.value)}
                                    min="0"
                                  />
                                  <span className={styles.inputMeta}>/ {data.meta}</span>
                                </div>
                                <div className={styles.inputProgress}>
                                  <div className={styles.inputProgressFill} style={{ width: `${indPercent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {Object.keys(form.commitments || {}).length > 0 && (
                      <div className={styles.formSection}>
                        <h3 className={styles.sectionHeading}>Compromisos de Fe</h3>
                        <div className={styles.commitGrid}>
                          {Object.entries(form.commitments).map(([key, value]) => (
                            <div key={key} className={styles.commitCard}>
                              <div className={styles.commitTitle}>{AREA_LABELS[key] || key}</div>
                              <div className={styles.modernSegment}>
                                {["NO", "PARCIAL", "SÍ"].map(opt => (
                                  <button
                                    key={opt}
                                    className={`${styles.modernSegmentBtn} ${value === opt ? styles.modernSegmentActive : ""}`}
                                    onClick={() => handleCommitmentChange(area.area_id, key, opt)}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.formActions}>
                      <button 
                        className={styles.modernSaveBtn} 
                        onClick={() => saveArea(area.area_id)}
                        disabled={saving === area.area_id}
                      >
                        {saving === area.area_id ? "Guardando..." : "Guardar Avances"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

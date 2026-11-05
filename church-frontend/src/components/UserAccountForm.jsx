/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useMemo, useState } from "react";
import {
  Alert, Autocomplete, Button, Checkbox, CircularProgress, FormControlLabel,
  IconButton, InputAdornment, Switch, TextField, Typography
} from "@mui/material";
import {
  AdminPanelSettingsOutlined, BadgeOutlined, CalendarMonthOutlined,
  CheckCircleOutlined, ChurchOutlined, DomainOutlined, ExpandLess, ExpandMore,
  HowToRegOutlined, LockOutlined, PersonOutline, QueryStatsOutlined,
  RadioButtonUncheckedOutlined, ReceiptLongOutlined, SpeakerNotesOutlined,
  SpeedOutlined, VisibilityOffOutlined, VisibilityOutlined, VolunteerActivismOutlined,
  ViewKanbanOutlined, WorkspacePremiumOutlined
} from "@mui/icons-material";
import { USER_MODULES } from "./userAccess";
import styles from "./UserAccountForm.module.css";

const EMPTY_FORM = {
  name: "", username: "", email: "", password: "", member_id: null,
  is_admin: false, is_super_admin: false, is_active: true, modules: [], accessScope: "none"
};

const MODULE_ICONS = {
  dashboard: <SpeedOutlined />, members: <BadgeOutlined />,
  ministries: <VolunteerActivismOutlined />, finance: <ReceiptLongOutlined />,
  projects: <ViewKanbanOutlined />, events: <CalendarMonthOutlined />,
  privileges: <WorkspacePremiumOutlined />, announcements: <SpeakerNotesOutlined />,
  reports: <QueryStatsOutlined />, attendance: <HowToRegOutlined />
};

const accessScopeFromModules = modules => {
  if (modules.some(module => module.startsWith("ministry."))) return "specific";
  if (modules.includes("workspace")) return "all";
  return "none";
};

const initialForm = initial => {
  if (!initial) return EMPTY_FORM;
  const modules = initial.modules || [];
  return {
    ...EMPTY_FORM,
    ...initial,
    password: "",
    member_id: initial.member_id || null,
    modules,
    accessScope: accessScopeFromModules(modules)
  };
};

const passwordError = password => {
  if (password.length < 8) return "Debe tener al menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Debe incluir una letra mayúscula.";
  if (!/[a-z]/.test(password)) return "Debe incluir una letra minúscula.";
  if (!/\d/.test(password)) return "Debe incluir un número.";
  if (!/[\W_]/.test(password)) return "Debe incluir un carácter especial.";
  return "";
};

function Section({ icon, title, description, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <div>
          <Typography component="h3" className={styles.sectionTitle}>{title}</Typography>
          <Typography className={styles.sectionDescription}>{description}</Typography>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function UserAccountForm({
  initial, currentUser, users, members, ministries,
  onSubmit, onCancel, submitting, serverError
}) {
  const [form, setForm] = useState(() => initialForm(initial));
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = Boolean(initial?.id);
  const isSelf = isEditing && initial.id === currentUser.id;
  const accountRole = form.is_super_admin ? "super" : form.is_admin ? "admin" : "standard";

  const availableMembers = useMemo(() => {
    const assigned = new Set(users.filter(user => user.id !== initial?.id && user.member_id).map(user => user.member_id));
    return members.filter(member => (member.status === "active" || member.id === initial?.member_id) && !assigned.has(member.id));
  }, [initial, members, users]);

  const changeField = event => {
    const { name, value, checked, type } = event.target;
    setForm(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors(current => current[name] ? { ...current, [name]: "" } : current);
  };

  const selectRole = role => {
    if (isSelf && role !== accountRole) return;
    setForm(current => {
      const modules = [...current.modules];
      if (role === "standard" && current.accessScope !== "none" && !modules.includes("workspace")) modules.push("workspace");
      return {
        ...current,
        is_admin: role === "admin" || role === "super",
        is_super_admin: role === "super",
        modules: role === "standard" ? modules : []
      };
    });
  };

  const selectAccessScope = scope => {
    setForm(current => {
      const modules = current.modules.filter(module => module !== "workspace" && !module.startsWith("ministry."));
      if (scope === "all" || scope === "specific") modules.push("workspace");
      return { ...current, accessScope: scope, modules };
    });
    setErrors(current => ({ ...current, accessScope: "" }));
  };

  const toggleMinistry = ministryId => {
    const key = `ministry.${ministryId}`;
    setForm(current => ({
      ...current,
      modules: current.modules.includes(key)
        ? current.modules.filter(module => module !== key)
        : [...current.modules, key]
    }));
    setErrors(current => ({ ...current, accessScope: "" }));
  };

  const toggleModule = module => {
    setForm(current => {
      const childIds = module.children?.map(child => child.id) || [];
      const active = current.modules.includes(module.id);
      const modules = active
        ? current.modules.filter(id => id !== module.id && !childIds.includes(id))
        : [...current.modules.filter(id => !childIds.includes(id)), module.id];
      return { ...current, modules };
    });
    setErrors(current => ({ ...current, modules: "" }));
  };

  const toggleSubmodule = (module, submoduleId) => {
    setForm(current => {
      const childIds = module.children.map(child => child.id);
      let modules = current.modules.filter(id => id !== module.id);
      if (current.modules.includes(submoduleId)) {
        modules = modules.filter(id => id !== submoduleId);
      } else {
        modules = [...modules, submoduleId];
      }
      const selectedChildren = childIds.filter(id => modules.includes(id));
      if (selectedChildren.length) modules.push(module.id);
      return { ...current, modules: [...new Set(modules)] };
    });
    setErrors(current => ({ ...current, modules: "" }));
  };

  const submit = event => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(form.username.trim())) nextErrors.username = "Usa de 3 a 40 letras, números, puntos o guiones.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "Ingresa un correo electrónico válido.";
    if (!isEditing && !form.password) nextErrors.password = "La contraseña temporal es obligatoria.";
    if (form.password) nextErrors.password = passwordError(form.password);
    if (accountRole === "standard" && form.accessScope === "specific" && !form.modules.some(module => module.startsWith("ministry."))) {
      nextErrors.accessScope = "Selecciona al menos un ministerio.";
    }
    if (accountRole === "standard" && form.is_active && form.modules.length === 0) {
      nextErrors.modules = "Asigna al menos un acceso antes de guardar una cuenta activa.";
    }
    Object.keys(nextErrors).forEach(key => { if (!nextErrors[key]) delete nextErrors[key]; });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      member_id: form.member_id,
      is_admin: form.is_admin,
      is_super_admin: form.is_super_admin,
      modules: accountRole === "standard" ? [...new Set(form.modules)] : []
    };
    if (isEditing) payload.is_active = form.is_active;
    if (form.password) payload.password = form.password;
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className={styles.formBody}>
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Section icon={<PersonOutline />} title="Identidad de la cuenta" description="Vincula la cuenta con una persona y define sus datos de acceso.">
          <div className={styles.fields}>
            <Autocomplete
              className={styles.fullField}
              options={availableMembers}
              getOptionLabel={option => `${option.first_name} ${option.last_name}`}
              value={availableMembers.find(member => member.id === form.member_id) || null}
              onChange={(_event, member) => setForm(current => ({
                ...current,
                member_id: member?.id || null,
                name: member && !current.name ? `${member.first_name} ${member.last_name}` : current.name,
                email: member?.email && !current.email ? member.email : current.email
              }))}
              noOptionsText="No hay miembros disponibles"
              renderInput={params => <TextField {...params} label="Miembro vinculado" helperText="Opcional. Cada miembro puede tener una sola cuenta." />}
            />
            <TextField name="name" label="Nombre para mostrar" value={form.name} onChange={changeField} error={Boolean(errors.name)} helperText={errors.name} required fullWidth />
            <TextField name="username" label="Nombre de usuario" value={form.username} onChange={changeField} error={Boolean(errors.username)} helperText={errors.username || "Se guardará en minúsculas."} required fullWidth />
            <TextField name="email" label="Correo electrónico" value={form.email} onChange={changeField} type="email" error={Boolean(errors.email)} helperText={errors.email} required fullWidth />
            {!isSelf && <TextField
              name="password" label={isEditing ? "Nueva contraseña temporal" : "Contraseña temporal"}
              value={form.password} onChange={changeField} type={showPassword ? "text" : "password"}
              error={Boolean(errors.password)} required={!isEditing}
              helperText={errors.password || (isEditing ? "Déjala vacía para conservar la actual." : "8+ caracteres, mayúscula, minúscula, número y símbolo.")}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(value => !value)} edge="end">{showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> }}
              fullWidth
            />}
          </div>
          {isEditing && !isSelf && <Alert className={styles.inlineAlert} severity="info" icon={<LockOutlined />}>Al asignar una nueva contraseña, el usuario deberá cambiarla al iniciar sesión.</Alert>}
          {isSelf && <Alert className={styles.inlineAlert} severity="info">Tu contraseña se cambia desde Configuración → Seguridad.</Alert>}
        </Section>

        <Section icon={<AdminPanelSettingsOutlined />} title="Nivel de acceso" description="Elige un nivel claro. Solo el súper administrador puede otorgar acceso total.">
          {currentUser.is_super_admin ? (
            <div className={styles.roleGrid}>
              {[
                ["standard", "Usuario por módulos", "Acceso únicamente a las áreas seleccionadas."],
                ["admin", "Administrador", "Acceso operativo a todos los módulos."],
                ["super", "Súper administrador", "Incluye seguridad, auditoría y respaldos."]
              ].map(([value, label, description]) => (
                <button key={value} type="button" className={`${styles.choiceCard} ${accountRole === value ? styles.choiceSelected : ""}`} onClick={() => selectRole(value)} disabled={isSelf && accountRole !== value}>
                  <span className={styles.choiceMark}>{accountRole === value ? <CheckCircleOutlined /> : <RadioButtonUncheckedOutlined />}</span>
                  <span><strong>{label}</strong><small>{description}</small></span>
                </button>
              ))}
            </div>
          ) : (
            <Alert severity="info">El nivel administrativo solo puede cambiarlo un súper administrador.</Alert>
          )}

          {isEditing && currentUser.is_super_admin && (
            <div className={styles.statusRow}>
              <div><strong>Cuenta activa</strong><span>{isSelf ? "Tu propia cuenta debe permanecer activa." : "Al desactivarla se bloquea el inicio de sesión."}</span></div>
              <Switch name="is_active" checked={form.is_active} onChange={changeField} disabled={isSelf} color="success" />
            </div>
          )}
        </Section>

        {accountRole === "standard" && (
          <Section icon={<ChurchOutlined />} title="Acceso al portal de ministerios" description="Define si verá todos los ministerios, algunos específicos o ninguno.">
            <div className={styles.scopeGrid}>
              {[
                ["none", "Sin acceso", "No verá el portal de ministerios.", <LockOutlined />],
                ["all", "Todos", "Podrá entrar a todos los ministerios.", <DomainOutlined />],
                ["specific", "Específicos", "Solo verá los ministerios elegidos.", <ChurchOutlined />]
              ].map(([value, label, description, icon]) => (
                <button key={value} type="button" className={`${styles.scopeCard} ${form.accessScope === value ? styles.scopeSelected : ""}`} onClick={() => selectAccessScope(value)}>
                  {icon}<span><strong>{label}</strong><small>{description}</small></span>
                </button>
              ))}
            </div>
            {form.accessScope === "specific" && (
              <div className={styles.ministryPicker}>
                <Typography className={styles.pickerLabel}>Ministerios permitidos</Typography>
                {ministries.length ? ministries.map(ministry => {
                  const selected = form.modules.includes(`ministry.${ministry.id}`);
                  return <FormControlLabel key={ministry.id} className={selected ? styles.ministrySelected : ""} control={<Checkbox checked={selected} onChange={() => toggleMinistry(ministry.id)} />} label={ministry.name} />;
                }) : <Typography className={styles.emptyText}>No hay ministerios registrados.</Typography>}
              </div>
            )}
            {errors.accessScope && <Typography className={styles.errorText}>{errors.accessScope}</Typography>}
          </Section>
        )}

        {accountRole === "standard" && (
          <Section icon={<BadgeOutlined />} title="Módulos del sistema" description="Activa únicamente las áreas necesarias para las funciones de este usuario.">
            {errors.modules && <Alert className={styles.modulesError} severity="warning">{errors.modules}</Alert>}
            <div className={styles.moduleGrid}>
              {USER_MODULES.map(module => {
                const active = form.modules.includes(module.id);
                const submodules = module.children || [];
                const isExpanded = expanded[module.id];
                return (
                  <div key={module.id} className={`${styles.moduleCard} ${active ? styles.moduleActive : ""}`}>
                    <div className={styles.moduleMain}>
                      <span className={styles.moduleIcon}>{MODULE_ICONS[module.id]}</span>
                      <div className={styles.moduleCopy}><strong>{module.label}</strong><small>{module.description}</small></div>
                      {submodules.length > 0 && <IconButton size="small" aria-label={`${isExpanded ? "Ocultar" : "Mostrar"} opciones de ${module.label}`} onClick={() => setExpanded(current => ({ ...current, [module.id]: !current[module.id] }))}>{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>}
                      <Checkbox checked={active} onChange={() => toggleModule(module)} icon={<RadioButtonUncheckedOutlined />} checkedIcon={<CheckCircleOutlined />} />
                    </div>
                    {submodules.length > 0 && isExpanded && (
                      <div className={styles.submoduleList}>
                        <Typography>Acceso específico</Typography>
                        {submodules.map(submodule => <FormControlLabel key={submodule.id} control={<Checkbox checked={form.modules.includes(submodule.id)} onChange={() => toggleSubmodule(module, submodule.id)} />} label={submodule.label} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>

      <div className={styles.actions}>
        <Button onClick={onCancel} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button type="submit" variant="contained" disableElevation disabled={submitting} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}>
          {submitting ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}

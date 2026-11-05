/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useEffect, useRef, useState } from "react";
import {
  Alert, Avatar, Box, Button, CircularProgress, IconButton,
  MenuItem, TextField, Typography
} from "@mui/material";
import {
  BadgeOutlined, CameraAltOutlined, ChurchOutlined,
  ContactPhoneOutlined, PersonOutline, WorkOutline
} from "@mui/icons-material";
import { API_URL } from "../api/api";
import styles from "./MemberForm.module.css";

const EMPTY_FORM = {
  first_name: "", last_name: "", phone: "", email: "",
  address: "", birth_date: "", baptism_date: "", status: "active",
  photo_url: "", gender: "", marital_status: "", occupation: "",
  join_date: "", emergency_contact: "", church_role: ""
};

const CONGREGATIONAL_ROLES = [
  { value: "", label: "Miembro sin responsabilidad general" },
  { value: "Pastor", label: "Pastor titular" },
  { value: "Co-Pastor", label: "Pastor asociado" },
  { value: "Anciano/a", label: "Anciano/a" },
  { value: "Diácono/a", label: "Diácono/a" },
  { value: "Secretario", label: "Secretario/a general" },
  { value: "Tesorero", label: "Tesorero/a general" }
];

const KNOWN_ROLE_VALUES = new Set(CONGREGATIONAL_ROLES.map(role => role.value));

const normalizeGender = value => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["m", "masculino", "hombre"].includes(normalized)) return "Masculino";
  if (["f", "femenino", "mujer"].includes(normalized)) return "Femenino";
  return value || "";
};

const photoSource = photoUrl => {
  if (!photoUrl) return "";
  return /^https?:\/\//i.test(photoUrl) ? photoUrl : `${API_URL}${photoUrl}`;
};

function Section({ icon, title, description, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <div>
          <Typography component="h3" className={styles.sectionTitle}>{title}</Typography>
          {description && <Typography className={styles.sectionDescription}>{description}</Typography>}
        </div>
      </div>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}

export default function MemberForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => initial
    ? { ...EMPTY_FORM, ...initial, gender: normalizeGender(initial.gender) }
    : EMPTY_FORM
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(() => photoSource(initial?.photo_url));
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef("");
  const isEditing = Boolean(initial?.id);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setFormErrors(current => current[name] ? { ...current, [name]: "" } : current);
  };

  const handleFileChange = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormErrors(current => ({ ...current, photo: "Usa una imagen JPG, PNG o WebP." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(current => ({ ...current, photo: "La imagen no puede superar los 5 MB." }));
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setFormErrors(current => ({ ...current, photo: "" }));
    setPhotoFile(file);
    setPhotoPreview(objectUrlRef.current);
  };

  const handleSubmit = event => {
    event.preventDefault();
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = "El nombre es obligatorio.";
    if (!form.last_name.trim()) errors.last_name = "El apellido es obligatorio.";
    if (!form.birth_date) errors.birth_date = "La fecha es necesaria para clasificar la asistencia.";
    if (!normalizeGender(form.gender)) errors.gender = "Selecciona el género para clasificar la asistencia.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Ingresa un correo electrónico válido.";
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    onSubmit({
      ...form,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      occupation: form.occupation.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      church_role: form.church_role || null,
      birth_date: form.birth_date || null,
      baptism_date: form.baptism_date || null,
      join_date: form.join_date || null,
      gender: normalizeGender(form.gender)
    }, photoFile);
  };

  const hasLegacyRole = form.church_role && !KNOWN_ROLE_VALUES.has(form.church_role);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={styles.layout}>
        <aside className={styles.profilePanel}>
          <div className={styles.photoWrap}>
            <Avatar
              src={photoPreview}
              alt={form.first_name ? `Foto de ${form.first_name}` : "Foto del miembro"}
              className={styles.avatar}
            >
              {!photoPreview && <PersonOutline />}
            </Avatar>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <IconButton
              aria-label="Seleccionar fotografía del miembro"
              onClick={() => fileInputRef.current?.click()}
              className={styles.photoButton}
            >
              <CameraAltOutlined fontSize="small" />
            </IconButton>
          </div>
          <Typography className={styles.profileTitle}>Fotografía</Typography>
          <Typography className={styles.profileHint}>JPG, PNG o WebP · máximo 5 MB</Typography>
          {formErrors.photo && <Typography className={styles.photoError}>{formErrors.photo}</Typography>}

          <div className={styles.requiredNote}>
            <BadgeOutlined fontSize="small" />
            <span>Nombre, apellido, fecha de nacimiento y género son necesarios para registrar al miembro.</span>
          </div>
        </aside>

        <div className={styles.content}>
          <Section
            icon={<PersonOutline fontSize="small" />}
            title="Información personal"
            description="Datos básicos para identificar y clasificar correctamente al miembro."
          >
            <TextField name="first_name" label="Nombre" value={form.first_name} onChange={handleChange} required error={Boolean(formErrors.first_name)} helperText={formErrors.first_name} fullWidth />
            <TextField name="last_name" label="Apellido" value={form.last_name} onChange={handleChange} required error={Boolean(formErrors.last_name)} helperText={formErrors.last_name} fullWidth />
            <TextField name="birth_date" label="Fecha de nacimiento" value={form.birth_date || ""} onChange={handleChange} type="date" required error={Boolean(formErrors.birth_date)} helperText={formErrors.birth_date || "Se usa para el grupo de edad en asistencia."} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField name="gender" label="Género" value={form.gender || ""} onChange={handleChange} select required error={Boolean(formErrors.gender)} helperText={formErrors.gender || "Se usa en las estadísticas de asistencia."} fullWidth>
              <MenuItem value=""><em>Seleccionar</em></MenuItem>
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Femenino">Femenino</MenuItem>
            </TextField>
            <TextField name="marital_status" label="Estado civil" value={form.marital_status || ""} onChange={handleChange} select fullWidth>
              <MenuItem value=""><em>Sin especificar</em></MenuItem>
              <MenuItem value="Soltero/a">Soltero/a</MenuItem>
              <MenuItem value="Casado/a">Casado/a</MenuItem>
              <MenuItem value="Viudo/a">Viudo/a</MenuItem>
              <MenuItem value="Divorciado/a">Divorciado/a</MenuItem>
              <MenuItem value="Unión Libre">Unión libre</MenuItem>
            </TextField>
          </Section>

          <Section icon={<ContactPhoneOutlined fontSize="small" />} title="Contacto" description="Información para comunicación y atención de emergencias.">
            <TextField name="phone" label="Teléfono" value={form.phone || ""} onChange={handleChange} fullWidth />
            <TextField name="email" label="Correo electrónico" value={form.email || ""} onChange={handleChange} type="email" error={Boolean(formErrors.email)} helperText={formErrors.email} fullWidth />
            <TextField className={styles.fullField} name="address" label="Dirección" value={form.address || ""} onChange={handleChange} fullWidth />
            <TextField className={styles.fullField} name="emergency_contact" label="Contacto de emergencia" value={form.emergency_contact || ""} onChange={handleChange} helperText="Puedes incluir nombre, parentesco y teléfono." fullWidth />
          </Section>

          <Section icon={<ChurchOutlined fontSize="small" />} title="Vida congregacional" description="Fechas y responsabilidades generales dentro de la iglesia.">
            <TextField name="join_date" label="Fecha de ingreso" value={form.join_date || ""} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth />
            <TextField name="baptism_date" label="Fecha de bautismo" value={form.baptism_date || ""} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth />
            <TextField className={styles.fullField} name="church_role" label="Responsabilidad congregacional" value={form.church_role || ""} onChange={handleChange} select helperText="Solo para responsabilidades que abarcan a toda la congregación." fullWidth>
              {CONGREGATIONAL_ROLES.map(role => <MenuItem key={role.value || "regular"} value={role.value}>{role.label}</MenuItem>)}
              {hasLegacyRole && <MenuItem value={form.church_role}>{form.church_role} (registro anterior)</MenuItem>}
            </TextField>
            <Alert className={styles.roleNotice} severity="info" icon={false}>
              <strong>Esta responsabilidad no concede acceso al sistema.</strong> Los permisos se asignan en Usuarios y los cargos específicos se administran desde Ministerios.
            </Alert>
          </Section>

          <Section icon={<WorkOutline fontSize="small" />} title="Información adicional">
            <TextField name="occupation" label="Ocupación o profesión" value={form.occupation || ""} onChange={handleChange} fullWidth />
            {isEditing && (
              <TextField name="status" label="Estado del registro" value={form.status || "active"} onChange={handleChange} select fullWidth>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </TextField>
            )}
          </Section>
        </div>
      </div>

      <Box className={styles.actions}>
        <Button onClick={onCancel} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button type="submit" variant="contained" disableElevation disabled={submitting} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}>
          {submitting ? "Guardando…" : isEditing ? "Guardar cambios" : "Registrar miembro"}
        </Button>
      </Box>
    </form>
  );
}

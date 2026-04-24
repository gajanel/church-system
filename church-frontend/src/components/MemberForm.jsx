import { useState, useEffect, useRef } from "react";
import { Grid, TextField, MenuItem, Button, Box, Avatar, IconButton, Typography, Alert, CircularProgress } from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";

const emptyForm = {
  first_name: "", last_name: "", phone: "", email: "",
  address: "", birth_date: "", baptism_date: "", status: "active",
  photo_url: "", gender: "", marital_status: "", occupation: "",
  join_date: "", emergency_contact: ""
};

export default function MemberForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [formErrors, setFormErrors] = useState({});  // BUG-02: validación controlada por JS
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({ ...emptyForm, ...initial });
      setPhotoPreview(initial.photo_url ? `http://${window.location.hostname}:8000${initial.photo_url}` : "");
    }
    else {
      setForm(emptyForm);
      setPhotoPreview("");
    }
    setPhotoFile(null);
    setFormErrors({});
  }, [initial]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpiar error del campo al escribir
    if (formErrors[e.target.name]) {
      setFormErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo MIME en el cliente
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, photo: "Solo se permiten imágenes JPG, PNG o WebP" }));
      return;
    }
    // Validar tamaño máximo: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, photo: "La imagen no puede superar los 5 MB" }));
      return;
    }
    setFormErrors(prev => ({ ...prev, photo: "" }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // BUG-02: Validación manual con mensajes de error inline (no nativa del browser)
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = "El nombre es obligatorio";
    if (!form.last_name.trim())  errors.last_name  = "El apellido es obligatorio";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Ingresa un correo electrónico válido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Asegurar que fechas vacías se envíen como null, no como cadena vacía
    const dataToSend = { 
      ...form,
      birth_date: form.birth_date || null,
      baptism_date: form.baptism_date || null,
      join_date: form.join_date || null
    };
    onSubmit(dataToSend, photoFile);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Photo Upload Section */}
        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={photoPreview}
              sx={{ width: 120, height: 120, mb: 1, border: '4px solid', borderColor: 'primary.light', bgcolor: 'grey.200' }}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={() => fileInputRef.current.click()}
              sx={{
                position: 'absolute',
                bottom: 5,
                right: -5,
                bgcolor: 'white',
                boxShadow: 2,
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              <PhotoCamera fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Haz clic en la cámara para subir foto
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField 
            name="first_name" label="Nombre *" value={form.first_name} 
            onChange={handleChange} fullWidth
            error={!!formErrors.first_name}
            helperText={formErrors.first_name}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="last_name" label="Apellido *" value={form.last_name} 
            onChange={handleChange} fullWidth
            error={!!formErrors.last_name}
            helperText={formErrors.last_name}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="phone" label="Teléfono" value={form.phone} 
            onChange={handleChange} fullWidth 
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="email" label="Email" value={form.email} 
            onChange={handleChange} fullWidth type="email"
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField 
            name="address" label="Dirección" value={form.address} 
            onChange={handleChange} fullWidth 
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="birth_date" label="Fecha de nacimiento" value={form.birth_date || ""} 
            onChange={handleChange} fullWidth type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="baptism_date" label="Fecha de bautismo" value={form.baptism_date || ""} 
            onChange={handleChange} fullWidth type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField 
            name="gender" label="Género" value={form.gender || ""} 
            onChange={handleChange} fullWidth select
          >
            <MenuItem value=""><em>—</em></MenuItem>
            <MenuItem value="Masculino">Masculino</MenuItem>
            <MenuItem value="Femenino">Femenino</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField 
            name="marital_status" label="Estado Civil" value={form.marital_status || ""} 
            onChange={handleChange} fullWidth select
          >
            <MenuItem value=""><em>—</em></MenuItem>
            <MenuItem value="Soltero/a">Soltero/a</MenuItem>
            <MenuItem value="Casado/a">Casado/a</MenuItem>
            <MenuItem value="Viudo/a">Viudo/a</MenuItem>
            <MenuItem value="Divorciado/a">Divorciado/a</MenuItem>
            <MenuItem value="Unión Libre">Unión Libre</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField 
            name="join_date" label="Fecha Ingreso a Iglesia" value={form.join_date || ""} 
            onChange={handleChange} fullWidth type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="occupation" label="Ocupación / Profesión" value={form.occupation || ""} 
            onChange={handleChange} fullWidth 
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            name="emergency_contact" label="Contacto de Emergencia" value={form.emergency_contact || ""} 
            onChange={handleChange} fullWidth 
          />
        </Grid>
        <Grid item xs={12}>
          <TextField 
            name="status" label="Estado" value={form.status} 
            onChange={handleChange} fullWidth select
          >
            <MenuItem value="active">Activo</MenuItem>
            <MenuItem value="inactive">Inactivo</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} color="inherit" sx={{ fontWeight: 600 }} disabled={submitting}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          sx={{ px: 4, minWidth: 120 }} 
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </form>
  );
}
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getMembers, createMember, updateMember, deleteMember,
         getMemberMinistries, assignMinistry, removeMinistry, uploadMemberPhoto } from "../api/members";
import { getMinistries, getMinistryRoles } from "../api/ministries";
import MemberForm from "../components/MemberForm";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, TextField, IconButton, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  DialogContentText, Tooltip
} from "@mui/material";
import {
  Search, PersonAdd, Phone, Email, Edit, Delete, Visibility, AccountBalance,
  ChevronLeft, ChevronRight
} from "@mui/icons-material";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import { CardSkeleton } from "../components/ui/SkeletonLoader";
import s from "../styles/page.module.css";

export default function Members() {
  const location = useLocation();
  const [members, setMembers]                 = useState([]);
  const [editing, setEditing]                 = useState(null);
  const [error, setError]                     = useState("");
  const [search, setSearch]                   = useState("");
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [totalItems, setTotalItems]           = useState(0);
  const [loading, setLoading]                 = useState(false);
  const [showMemberForm, setShowMemberForm]   = useState(false);
  const [showDetails, setShowDetails]         = useState(false);
  const [showMinistries, setShowMinistries]   = useState(false);
  const [selectedMember, setSelectedMember]   = useState(null);
  const [memberMinistries, setMemberMins]     = useState([]);
  const [allMinistries, setAllMins]           = useState([]);
  const [selectedMinId, setSelectedMinId]     = useState("");
  const [ministryRoles, setMinistryRoles]     = useState([]);
  const [selectedRoleId, setSelectedRoleId]   = useState("");
  const [confirmOpen, setConfirmOpen]         = useState(false);
  const [confirmConfig, setConfirmConfig]     = useState({ title: "", content: "", onConfirm: () => {} });
  const [submitting, setSubmitting]           = useState(false);

  const load = async () => {
    setLoading(true);
    try { 
      const res = await getMembers(page, 20); 
      setMembers(res.data.items); 
      setTotalPages(res.data.pages);
      setTotalItems(res.data.total);
    }
    catch { setError("Error al cargar miembros"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, location.key]);

  useEffect(() => {
    if (!selectedMinId) { setMinistryRoles([]); setSelectedRoleId(""); return; }
    getMinistryRoles(selectedMinId).then(res => { setMinistryRoles(res.data); setSelectedRoleId(""); });
  }, [selectedMinId]);

  const filtered = members.filter(m => {
    const name  = `${m.first_name||""} ${m.last_name||""}`.toLowerCase();
    const email = String(m.email||"").toLowerCase();
    const phone = String(m.phone||"");
    const q     = String(search||"").toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  const openMinistries = async (member) => {
    setSelectedMember(member); setError("");
    const [mmRes, allRes] = await Promise.all([getMemberMinistries(member.id), getMinistries()]);
    setMemberMins(mmRes.data); setAllMins(allRes.data);
    setSelectedMinId(""); setSelectedRoleId("");
    setShowDetails(false); setShowMinistries(true);
  };

  const openDetalle = async (member) => {
    setSelectedMember(member);
    const mmRes = await getMemberMinistries(member.id);
    setMemberMins(mmRes.data); setShowDetails(true);
  };

  const handleAssign = async () => {
    if (!selectedMinId || !selectedRoleId) { setError("Selecciona un ministerio y un rol"); return; }
    try {
      await assignMinistry(selectedMember.id, { ministry_id: parseInt(selectedMinId), ministry_role_id: parseInt(selectedRoleId) });
      const res = await getMemberMinistries(selectedMember.id);
      setMemberMins(res.data); setSelectedMinId(""); setSelectedRoleId(""); setError("");
    } catch { setError("El miembro ya está asignado a este ministerio"); }
  };

  const handleRemove = (mmId) => {
    setConfirmConfig({
      title: "¿Quitar ministerio?",
      content: "¿Estás seguro de que deseas quitar esta asignación?",
      onConfirm: async () => {
        await removeMinistry(selectedMember.id, mmId);
        const res = await getMemberMinistries(selectedMember.id);
        setMemberMins(res.data); setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  const handleSubmit = async (data, photoFile) => {
    setSubmitting(true);
    try {
      let memberId;
      if (editing) { await updateMember(editing.id, data); memberId = editing.id; }
      else { const res = await createMember(data); memberId = res.data.id; }
      if (photoFile) await uploadMemberPhoto(memberId, photoFile);
      setShowMemberForm(false); setEditing(null); load();
    } catch { setError("Error al guardar el miembro"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: "¿Eliminar miembro?",
      content: "Esta acción no se puede deshacer. Se conservará el historial financiero.",
      onConfirm: async () => {
        try { await deleteMember(id); setConfirmOpen(false); load(); }
        catch { setError("Error al eliminar. Puede tener dependencias."); setConfirmOpen(false); }
      }
    });
    setConfirmOpen(true);
  };

  const photoUrl = (m) => m.photo_url ? `http://${window.location.hostname}:8000${m.photo_url}` : "";

  return (
    <div className={s.page}>
      <PageHeader title="Miembros" subtitle="Administra el directorio de la congregación.">
        <Button variant="contained" startIcon={<PersonAdd />}
          onClick={() => { setEditing(null); setShowMemberForm(true); }}>
          Nuevo Miembro
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <TextField placeholder="Buscar por nombre, email o teléfono..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 380 }, bgcolor: "background.paper" }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
      </div>

      {/* Grid de miembros */}
      {loading ? (
        <CardSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>No se encontraron miembros</p>
          <p className={s.emptyText}>Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <div className={s.cardGrid}>
          {filtered.map(m => (
            <Card key={m.id} style={{ borderTop: `3px solid ${m.status === "active" ? "var(--color-success)" : "var(--border-strong)"}` }}>
              <CardBody>
                <div className={s.memberHead}>
                  <Avatar src={photoUrl(m)}
                    sx={{ width: 50, height: 50, bgcolor: m.status === "active" ? "#1d4ed8" : "#9ca3af", fontWeight: 700, fontSize: 18 }}>
                    {!m.photo_url && `${m.first_name?.[0]||""}${m.last_name?.[0]||""}`}
                  </Avatar>
                  <div className={s.memberInfo}>
                    <p className={s.memberName}>{m.first_name} {m.last_name}</p>
                    <div className={s.memberMeta}><Phone sx={{ fontSize: 12 }} /> {m.phone || "Sin teléfono"}</div>
                    <div className={s.memberMeta}><Email sx={{ fontSize: 12 }} /> {m.email || "Sin email"}</div>
                    <div className={s.badgeRow}>
                      <Badge variant={m.status === "active" ? "success" : "default"} size="sm">
                        {m.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardBody>
              <div className={s.cardFooter}>
                <Button size="small" startIcon={<Visibility sx={{ fontSize: 14 }} />} onClick={() => openDetalle(m)}>Ver</Button>
                <div className={s.cardActions}>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => { setEditing(m); setShowMemberForm(true); }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ministerios">
                    <IconButton size="small" color="info" onClick={() => openMinistries(m)}>
                      <AccountBalance fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, marginTop:32, paddingBottom:32 }}>
          <Button 
            variant="outlined" size="small" startIcon={<ChevronLeft />} 
            disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>
            Anterior
          </Button>
          <p style={{ fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>
            Página {page} de {totalPages} <span style={{ fontWeight:400, color:"var(--text-muted)", marginLeft:8 }}>({totalItems} miembros)</span>
          </p>
          <Button 
            variant="outlined" size="small" endIcon={<ChevronRight />} 
            disabled={page === totalPages || loading} onClick={() => setPage(p => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}

      {/* MODAL: Formulario miembro */}
      <Dialog open={showMemberForm} onClose={() => setShowMemberForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editing ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle>
        <DialogContent dividers>
          <MemberForm initial={editing} onSubmit={handleSubmit} onCancel={() => setShowMemberForm(false)} submitting={submitting} />
        </DialogContent>
      </Dialog>

      {/* MODAL: Detalles */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        {selectedMember && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar src={photoUrl(selectedMember)} sx={{ bgcolor: "#0369a1" }}>
                {!selectedMember.photo_url && selectedMember.first_name?.[0]}
              </Avatar>
              {selectedMember.first_name} {selectedMember.last_name}
            </DialogTitle>
            <DialogContent dividers>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 24 }}>
                {[
                  ["Teléfono", selectedMember.phone],
                  ["Email", selectedMember.email],
                  ["Dirección", selectedMember.address],
                  ["Fecha de nacimiento", selectedMember.birth_date],
                  ["Género", selectedMember.gender],
                  ["Estado Civil", selectedMember.marital_status],
                  ["Ocupación", selectedMember.occupation],
                  ["Ingreso a la Iglesia", selectedMember.join_date],
                  ["Bautismo", selectedMember.baptism_date],
                  ["Contacto Emergencia", selectedMember.emergency_contact],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{val || "—"}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <AccountBalance sx={{ fontSize: 15, color: "var(--color-primary)" }} /> Ministerios Asignados
              </p>
              {memberMinistries.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No pertenece a ningún ministerio.</p>
              ) : (
                <TableContainer component={Paper} variant="outlined" elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Ministerio</TableCell><TableCell>Rol</TableCell></TableRow></TableHead>
                    <TableBody>
                      {memberMinistries.map(mm => (
                        <TableRow key={mm.id}><TableCell>{mm.ministry_name}</TableCell><TableCell>{mm.role}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Button variant="outlined" startIcon={<AccountBalance />} sx={{ mt: 2 }}
                onClick={() => { setShowDetails(false); openMinistries(selectedMember); }}>
                Gestionar Ministerios
              </Button>
            </DialogContent>
            <DialogActions><Button onClick={() => setShowDetails(false)}>Cerrar</Button></DialogActions>
          </>
        )}
      </Dialog>

      {/* MODAL: Gestión de ministerios */}
      <Dialog open={showMinistries} onClose={() => setShowMinistries(false)} maxWidth="sm" fullWidth>
        {selectedMember && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Gestionar Ministerios — {selectedMember.first_name}</DialogTitle>
            <DialogContent dividers>
              {error && <div className={s.errorText}>{error}</div>}
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Asignaciones Actuales</p>
              {memberMinistries.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Sin ministerios asignados.</p>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow><TableCell>Ministerio</TableCell><TableCell>Rol</TableCell><TableCell align="right">Acción</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                      {memberMinistries.map(mm => (
                        <TableRow key={mm.id}>
                          <TableCell>{mm.ministry_name}</TableCell>
                          <TableCell>{mm.role}</TableCell>
                          <TableCell align="right">
                            <IconButton color="error" size="small" onClick={() => handleRemove(mm.id)}><Delete fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <div className={s.subPanel}>
                <p className={s.subPanelTitle}>Asignar nuevo ministerio</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ministerio</InputLabel>
                    <Select value={selectedMinId} label="Ministerio" onChange={e => setSelectedMinId(e.target.value)}>
                      <MenuItem value=""><em>— Selecciona —</em></MenuItem>
                      {allMinistries.filter(m => !memberMinistries.find(mm => mm.ministry_id === m.id))
                        .map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {ministryRoles.length > 0 && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Rol</InputLabel>
                      <Select value={selectedRoleId} label="Rol" onChange={e => setSelectedRoleId(e.target.value)}>
                        <MenuItem value=""><em>— Selecciona —</em></MenuItem>
                        {ministryRoles.map(r => <MenuItem key={r.id} value={r.id}>{r.role}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                  <Button variant="contained" fullWidth onClick={handleAssign}>Añadir Asignación</Button>
                </div>
              </div>
            </DialogContent>
            <DialogActions><Button onClick={() => setShowMinistries(false)}>Cerrar</Button></DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmConfig.title}
        content={confirmConfig.content}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
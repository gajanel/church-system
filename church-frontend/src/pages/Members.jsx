import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getMembers, createMember, updateMember, deleteMember,
  getMemberMinistries, assignMinistry, removeMinistry, uploadMemberPhoto
} from "../api/members";
import { getMinistries, getMinistryRoles } from "../api/ministries";
import { API_URL } from "../api/api";
import MemberForm from "../components/MemberForm";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from "@mui/material";
import {
  PersonAddOutlined, EditOutlined, PersonOffOutlined,
  VisibilityOutlined, AccountBalanceOutlined, ChevronLeft, ChevronRight,
} from "@mui/icons-material";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import s from "../styles/page.module.css";

const GENDER_MAP  = { M: "Masculino", F: "Femenino", O: "Otro" };
const STATUS_OPTS = [{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }];

const COLUMNS = [
  { label: "Nombre",     width: "22%" },
  { label: "Teléfono",   width: "12%" },
  { label: "Email",      width: "18%" },
  { label: "Género",     width: "9%" },
  { label: "Estado",     width: "9%" },
  { label: "Acciones",   width: "14%", align: "center" },
];

export default function Members() {
  const location = useLocation();
  const [members, setMembers]               = useState([]);
  const [editing, setEditing]               = useState(null);
  const [error, setError]                   = useState("");
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [page, setPage]                     = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const [totalItems, setTotalItems]         = useState(0);
  const [loading, setLoading]               = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showDetails, setShowDetails]       = useState(false);
  const [showMinistries, setShowMinistries] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberMinistries, setMemberMins]   = useState([]);
  const [allMinistries, setAllMins]         = useState([]);
  const [selectedMinId, setSelectedMinId]   = useState("");
  const [ministryRoles, setMinistryRoles]   = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [confirmConfig, setConfirmConfig]   = useState({ title: "", content: "", onConfirm: () => {} });
  const [submitting, setSubmitting]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMembers(page, 25);
      setMembers(res.data.items); setTotalPages(res.data.pages); setTotalItems(res.data.total);
    } catch { setError("Error al cargar miembros"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, location.key]);
  useEffect(() => {
    if (!selectedMinId) { setMinistryRoles([]); setSelectedRoleId(""); return; }
    getMinistryRoles(selectedMinId).then(r => { setMinistryRoles(r.data); setSelectedRoleId(""); });
  }, [selectedMinId]);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const name = `${m.first_name||""} ${m.last_name||""}`.toLowerCase();
    return (!q || name.includes(q) || String(m.email||"").toLowerCase().includes(q) || String(m.phone||"").includes(q))
        && (!filterStatus || m.status === filterStatus);
  });

  const openMinistries = async (member) => {
    setSelectedMember(member); setError("");
    const [mm, all] = await Promise.all([getMemberMinistries(member.id), getMinistries()]);
    setMemberMins(mm.data); setAllMins(all.data); setSelectedMinId(""); setSelectedRoleId("");
    setShowDetails(false); setShowMinistries(true);
  };

  const openDetalle = async (member) => {
    setSelectedMember(member);
    const mm = await getMemberMinistries(member.id);
    setMemberMins(mm.data); setShowDetails(true);
  };

  const handleAssign = async () => {
    if (!selectedMinId || !selectedRoleId) { setError("Selecciona ministerio y rol"); return; }
    try {
      await assignMinistry(selectedMember.id, { ministry_id: +selectedMinId, ministry_role_id: +selectedRoleId });
      const res = await getMemberMinistries(selectedMember.id);
      setMemberMins(res.data); setSelectedMinId(""); setSelectedRoleId(""); setError("");
    } catch { setError("Ya está asignado a este ministerio"); }
  };

  const handleRemove = (mmId) => {
    setConfirmConfig({ title: "¿Quitar ministerio?", content: "Esta acción quitará la asignación.",
      onConfirm: async () => {
        await removeMinistry(selectedMember.id, mmId);
        setMemberMins((await getMemberMinistries(selectedMember.id)).data); setConfirmOpen(false);
      }
    }); setConfirmOpen(true);
  };

  const handleSubmit = async (data, photoFile) => {
    setSubmitting(true);
    try {
      let mid;
      if (editing) { await updateMember(editing.id, data); mid = editing.id; }
      else { mid = (await createMember(data)).data.id; }
      if (photoFile) await uploadMemberPhoto(mid, photoFile);
      setShowMemberForm(false); setEditing(null); load();
    } catch { setError("Error al guardar el miembro"); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = (id) => {
    setConfirmConfig({ title: "¿Desactivar miembro?", content: "El miembro pasará a estado inactivo y se removerán sus asignaciones a ministerios y privilegios.",
      onConfirm: async () => {
        try { await deleteMember(id); setConfirmOpen(false); load(); }
        catch { setError("Error al desactivar."); setConfirmOpen(false); }
      }
    }); setConfirmOpen(true);
  };

  const photoUrl = (m) => m.photo_url ? `${API_URL}${m.photo_url}` : "";

  return (
    <div className={s.page}>
      <PageHeader title="Miembros" subtitle={`${totalItems} registros en el directorio de la congregación`}>
        <Button variant="contained" size="small" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} startIcon={<PersonAddOutlined sx={{ fontSize: 15 }} />}
          onClick={() => { setEditing(null); setShowMemberForm(true); }}>
          Nuevo Miembro
        </Button>
      </PageHeader>

      {error && <div className={s.errorText}>{error}</div>}

      <DataTable
        columns={COLUMNS} rows={filtered} loading={loading}
        search={search} onSearch={setSearch}
        searchPlaceholder="Buscar por nombre, email o teléfono..."
        filters={[{ label: "Estado", value: filterStatus, onChange: setFilterStatus, options: STATUS_OPTS }]}
        emptyText="No se encontraron miembros."
        renderRow={(m, i) => (
          <TableRow key={m.id} sx={{ '&:nth-of-type(even)': { bgcolor: '#F9FAFB' }, '&:hover': { bgcolor:"#f1f5f9" }, transition: 'background-color 0.2s' }}>
            <TableCell>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Avatar src={photoUrl(m)} sx={{ width:32, height:32, fontSize:12, fontWeight:700, borderRadius:"50%",
                  bgcolor: "#f1f5f9", color: "#0F172A", border: "1px solid #e5e7eb" }}>
                  {!m.photo_url && `${m.first_name?.[0]||""}${m.last_name?.[0]||""}`}
                </Avatar>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight:600, fontSize:13 }}>{m.first_name} {m.last_name}</span>
                  {m.church_role && (
                    <span style={{ 
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", 
                      letterSpacing: "0.05em", color: "#7c3aed", marginTop: 2,
                      display: "flex", alignItems: "center", gap: 3
                    }}>
                      ◆ {m.church_role}
                    </span>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell sx={{ color:"text.secondary", fontSize:12 }}>{m.phone || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>No registrado</span>}</TableCell>
            <TableCell sx={{ color:"text.secondary", fontSize:12 }}>{m.email || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>No registrado</span>}</TableCell>
            <TableCell sx={{ fontSize:12 }}>{GENDER_MAP[m.gender] || m.gender || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>No registrado</span>}</TableCell>
            <TableCell>
              <Badge variant={m.status==="active"?"success":"default"} size="sm">
                {m.status==="active"?"Activo":"Inactivo"}
              </Badge>
            </TableCell>
            <TableCell align="center">
              <div style={{ display:"flex", justifyContent:"center", gap:2 }}>
                <Tooltip title="Ver detalle" placement="top" arrow><IconButton size="small" onClick={() => openDetalle(m)}><VisibilityOutlined sx={{ fontSize:16, color: "#64748b" }} /></IconButton></Tooltip>
                <Tooltip title="Asignar a Ministerios" placement="top" arrow><IconButton size="small" onClick={() => openMinistries(m)}><AccountBalanceOutlined sx={{ fontSize:16, color: "#64748b" }} /></IconButton></Tooltip>
                <Tooltip title="Editar registro" placement="top" arrow><IconButton size="small" onClick={() => { setEditing(m); setShowMemberForm(true); }}><EditOutlined sx={{ fontSize:16, color: "#3b82f6" }} /></IconButton></Tooltip>
                {m.status === "active" && (
                  <Tooltip title="Desactivar miembro" placement="top" arrow><IconButton size="small" color="error" onClick={() => handleDeactivate(m.id)}><PersonOffOutlined sx={{ fontSize:16 }} /></IconButton></Tooltip>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>
            Mostrando {(page-1)*25+1}–{Math.min(page*25,totalItems)} de {totalItems}
          </span>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <Button size="small" variant="outlined" startIcon={<ChevronLeft />} disabled={page===1||loading} onClick={() => setPage(p => p-1)}>Anterior</Button>
            <span style={{ fontSize:12, fontWeight:600 }}>Pág. {page}/{totalPages}</span>
            <Button size="small" variant="outlined" endIcon={<ChevronRight />} disabled={page===totalPages||loading} onClick={() => setPage(p => p+1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Member form dialog */}
      <Dialog open={showMemberForm} onClose={() => setShowMemberForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle>
        <DialogContent dividers>
          <MemberForm initial={editing} onSubmit={handleSubmit} onCancel={() => setShowMemberForm(false)} submitting={submitting} />
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        {selectedMember && (
          <>
            <DialogTitle sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
              <Avatar src={photoUrl(selectedMember)} sx={{ bgcolor:"#1e3a5f", borderRadius:"3px", width:28, height:28, fontSize:12 }}>
                {!selectedMember.photo_url && selectedMember.first_name?.[0]}
              </Avatar>
              {selectedMember.first_name} {selectedMember.last_name}
            </DialogTitle>
            <DialogContent dividers>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 24px", marginBottom:20 }}>
                {[["Teléfono",selectedMember.phone],["Email",selectedMember.email],["Dirección",selectedMember.address],
                  ["Nacimiento",selectedMember.birth_date],["Género",GENDER_MAP[selectedMember.gender]||selectedMember.gender],
                  ["Estado Civil",selectedMember.marital_status],["Ocupación",selectedMember.occupation],
                  ["Ingreso",selectedMember.join_date],["Bautismo",selectedMember.baptism_date],
                  ["Emergencia",selectedMember.emergency_contact], ["Cargo", selectedMember.church_role]
                ].map(([l,v]) => (
                  <div key={l}>
                    <p style={{ fontSize:10, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>{l}</p>
                    <p style={{ fontSize:13, color: l === "Cargo" && v ? "#7c3aed" : "var(--text-primary)", fontWeight: l === "Cargo" && v ? 700 : 400 }}>{v||"—"}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Ministerios</p>
              {memberMinistries.length === 0 ? <p style={{ color:"var(--text-muted)", fontSize:13 }}>Sin ministerios.</p> : (
                <TableContainer component={Paper} variant="outlined" elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Ministerio</TableCell><TableCell>Rol</TableCell></TableRow></TableHead>
                    <TableBody>{memberMinistries.map(mm => (<TableRow key={mm.id}><TableCell>{mm.ministry_name}</TableCell><TableCell>{mm.role}</TableCell></TableRow>))}</TableBody>
                  </Table>
                </TableContainer>
              )}
              <Button variant="contained" disableElevation size="small" startIcon={<AccountBalanceOutlined sx={{ fontSize:14 }} />} sx={{ mt:2, bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }}
                onClick={() => { setShowDetails(false); openMinistries(selectedMember); }}>Gestionar Ministerios</Button>
            </DialogContent>
            <DialogActions><Button onClick={() => setShowDetails(false)}>Cerrar</Button></DialogActions>
          </>
        )}
      </Dialog>

      {/* Ministries dialog */}
      <Dialog open={showMinistries} onClose={() => setShowMinistries(false)} maxWidth="sm" fullWidth>
        {selectedMember && (
          <>
            <DialogTitle>Ministerios — {selectedMember.first_name} {selectedMember.last_name}</DialogTitle>
            <DialogContent dividers>
              {error && <div className={s.errorText}>{error}</div>}
              {memberMinistries.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ mb:2 }} elevation={0}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Ministerio</TableCell><TableCell>Rol</TableCell><TableCell align="right">Acción</TableCell></TableRow></TableHead>
                    <TableBody>{memberMinistries.map(mm => (
                      <TableRow key={mm.id}>
                        <TableCell>{mm.ministry_name}</TableCell><TableCell>{mm.role}</TableCell>
                        <TableCell align="right"><IconButton color="error" size="small" onClick={() => handleRemove(mm.id)}><DeleteOutlined sx={{ fontSize:14 }} /></IconButton></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </TableContainer>
              )}
              <div className={s.subPanel}>
                <p className={s.subPanelTitle}>Asignar nuevo ministerio</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ministerio</InputLabel>
                    <Select value={selectedMinId} label="Ministerio" onChange={e => setSelectedMinId(e.target.value)}>
                      <MenuItem value=""><em>— Selecciona —</em></MenuItem>
                      {allMinistries.filter(m => !memberMinistries.find(mm => mm.ministry_id===m.id)).map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
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
                  <Button variant="contained" disableElevation sx={{ bgcolor:"#0F172A", textTransform:"none", fontWeight:600, '&:hover':{bgcolor:"#1E293B"} }} size="small" fullWidth onClick={handleAssign}>Añadir</Button>
                </div>
              </div>
            </DialogContent>
            <DialogActions><Button onClick={() => setShowMinistries(false)}>Cerrar</Button></DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog open={confirmOpen} title={confirmConfig.title} content={confirmConfig.content}
        onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
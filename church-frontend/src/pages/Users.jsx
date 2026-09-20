/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar, Button, Dialog, DialogContent, DialogTitle, IconButton,
  TableCell, TableRow, Tooltip, Typography
} from "@mui/material";
import {
  AdminPanelSettingsOutlined, DeleteOutlined, EditOutlined,
  PersonAddOutlined, SecurityOutlined
} from "@mui/icons-material";
import { getUsers, createUser, updateUser, deleteUser } from "../api/users";
import { getMinistries } from "../api/ministries";
import { getMembers } from "../api/members";
import UserAccountForm from "../components/UserAccountForm";
import { getUserModuleLabel } from "../components/userAccess";
import ConfirmDialog from "../components/ConfirmDialog";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import pageStyles from "../styles/page.module.css";
import styles from "./Users.module.css";

const COLUMNS = [
  { label: "Usuario", width: "25%" },
  { label: "Cuenta", width: "19%" },
  { label: "Nivel", width: "13%" },
  { label: "Accesos", width: "auto" },
  { label: "Estado", width: "10%" },
  { label: "Acciones", width: "84px", align: "right" }
];

const STATUS_OPTIONS = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" }
];

const roleInfo = user => {
  if (user.is_super_admin) return { label: "Súper admin", variant: "info" };
  if (user.is_admin) return { label: "Administrador", variant: "error" };
  return { label: "Por módulos", variant: "primary" };
};

const initials = name => String(name || "U").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

export default function Users() {
  const [users, setUsers] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", content: "", onConfirm: () => {} });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const memberById = useMemo(() => new Map(members.map(member => [member.id, member])), [members]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userResponse, ministryResponse, memberResponse] = await Promise.all([
        getUsers(),
        getMinistries().catch(() => ({ data: [] })),
        getMembers(1, 1000).catch(() => ({ data: { items: [] } }))
      ]);
      setUsers(userResponse.data);
      setMinistries(ministryResponse.data);
      setMembers(memberResponse.data.items || []);
      setError("");
    } catch {
      setError("No fue posible cargar las cuentas de usuario.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = user => {
    setEditing(user);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setShowForm(false);
    setEditing(null);
    setError("");
  };

  const saveUser = async payload => {
    setSubmitting(true);
    setError("");
    try {
      if (editing) await updateUser(editing.id, payload);
      else await createUser(payload);
      setShowForm(false);
      setEditing(null);
      await loadData();
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(item => item.msg).join(" · ") : detail || "No fue posible guardar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeactivate = user => {
    setConfirmConfig({
      title: `¿Desactivar a ${user.name}?`,
      content: "La cuenta perderá acceso inmediatamente. Un súper administrador podrá reactivarla desde la edición.",
      onConfirm: async () => {
        try {
          await deleteUser(user.id);
          await loadData();
        } catch (requestError) {
          setError(requestError.response?.data?.detail || "No fue posible desactivar la cuenta.");
        } finally {
          setConfirmOpen(false);
        }
      }
    });
    setConfirmOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [user.name, user.username, user.email].some(value => String(value || "").toLowerCase().includes(query));
    const matchesStatus = !statusFilter || (statusFilter === "active" ? user.is_active !== false : user.is_active === false);
    return matchesQuery && matchesStatus;
  });

  const canEdit = user => !user.is_admin || currentUser.is_super_admin || currentUser.id === user.id;
  const canDeactivate = user => user.id !== currentUser.id && !user.is_super_admin && (!user.is_admin || currentUser.is_super_admin) && user.is_active !== false;

  const activeCount = users.filter(user => user.is_active !== false).length;
  const adminCount = users.filter(user => user.is_admin || user.is_super_admin).length;
  const linkedCount = users.filter(user => user.member_id).length;

  return (
    <div className={pageStyles.page}>
      <PageHeader title="Gestión de usuarios" subtitle="Cuentas, niveles de acceso y permisos del sistema.">
        <Button variant="contained" size="small" disableElevation startIcon={<PersonAddOutlined />} onClick={openCreate} className={styles.primaryButton}>
          Nuevo usuario
        </Button>
      </PageHeader>

      <div className={styles.summaryGrid}>
        <div><span>Cuentas activas</span><strong>{activeCount}</strong></div>
        <div><span>Administradores</span><strong>{adminCount}</strong></div>
        <div><span>Vinculadas a miembros</span><strong>{linkedCount}</strong></div>
      </div>

      {error && !showForm && <div className={pageStyles.errorText}>{error}</div>}

      <DataTable
        columns={COLUMNS}
        rows={filteredUsers}
        loading={loading}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar por nombre, usuario o correo..."
        filters={[{ label: "Estado", value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS }]}
        emptyText="No se encontraron cuentas."
        renderRow={user => {
          const role = roleInfo(user);
          const member = memberById.get(user.member_id);
          const visibleModules = (user.modules || []).slice(0, 3);
          const extraModules = Math.max((user.modules || []).length - visibleModules.length, 0);
          return (
            <TableRow key={user.id} className={styles.tableRow}>
              <TableCell>
                <div className={styles.identityCell}>
                  <Avatar className={styles.avatar}>{initials(user.name)}</Avatar>
                  <div><strong>{user.name}</strong><span>{member ? `Miembro: ${member.first_name} ${member.last_name}` : "Cuenta sin miembro vinculado"}</span></div>
                </div>
              </TableCell>
              <TableCell><strong className={styles.username}>@{user.username}</strong><span className={styles.email}>{user.email}</span></TableCell>
              <TableCell><Badge variant={role.variant} size="sm">{role.label}</Badge></TableCell>
              <TableCell>
                <div className={styles.accessBadges}>
                  {user.is_admin ? <Badge variant="error" size="sm">Acceso total</Badge> : visibleModules.length ? <>
                    {visibleModules.map(module => <Badge key={module} variant={module.startsWith("ministry.") ? "info" : "ghost"} size="sm">{getUserModuleLabel(module, ministries)}</Badge>)}
                    {extraModules > 0 && <Badge variant="default" size="sm">+{extraModules}</Badge>}
                  </> : <Badge variant="default" size="sm">Sin accesos</Badge>}
                </div>
              </TableCell>
              <TableCell><Badge variant={user.is_active === false ? "default" : "success"} size="sm">{user.is_active === false ? "Inactiva" : "Activa"}</Badge></TableCell>
              <TableCell align="right">
                <div className={styles.actionsCell}>
                  {canEdit(user) && <Tooltip title="Editar cuenta"><IconButton size="small" onClick={() => openEdit(user)}><EditOutlined /></IconButton></Tooltip>}
                  {canDeactivate(user) && <Tooltip title="Desactivar cuenta"><IconButton size="small" color="error" onClick={() => confirmDeactivate(user)}><DeleteOutlined /></IconButton></Tooltip>}
                </div>
              </TableCell>
            </TableRow>
          );
        }}
      />

      <Dialog open={showForm} onClose={closeForm} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle className={styles.dialogTitle}>
          <span className={styles.dialogIcon}><SecurityOutlined /></span>
          <span>
            <Typography component="span">{editing ? "Editar cuenta de usuario" : "Crear cuenta de usuario"}</Typography>
            <Typography component="small">{editing ? "Actualiza identidad, estado y permisos." : "Define las credenciales y los accesos que realmente necesita."}</Typography>
          </span>
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, pt: 2.5 }}>
          <UserAccountForm
            key={editing?.id || "new-user"}
            initial={editing}
            currentUser={currentUser}
            users={users}
            members={members}
            ministries={ministries}
            onSubmit={saveUser}
            onCancel={closeForm}
            submitting={submitting}
            serverError={error}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={confirmOpen} title={confirmConfig.title} content={confirmConfig.content} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}

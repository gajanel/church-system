import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser, getRoles } from "../api/users";

const emptyForm = { name: "", email: "", password: "", role_id: "" };

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const load = async () => {
    try {
      const res = await getUsers();
      setUsuarios(res.data);
      setError("");
    } catch {
      setError("Error al cargar usuarios");
    }
  };

  const loadRoles = async () => {
    try {
      const res = await getRoles();
      setRoles(res.data);
      // Si aún no hay role_id seleccionado, usar el primer rol disponible
      if (res.data.length > 0) {
        setForm(f => ({ ...f, role_id: f.role_id || res.data[0].id }));
      }
    } catch {
      setError("Error al cargar roles");
    }
  };

  useEffect(() => {
    load();
    loadRoles();
  }, []);

  const getRoleName = (role_id) => {
    const found = roles.find(r => r.id === role_id);
    return found ? found.name : "Desconocido";
  };

  const filtered = usuarios.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form, role_id: Number(form.role_id) };
        if (!payload.password) delete payload.password;
        await updateUser(editing.id, payload);
      } else {
        await createUser({ ...form, role_id: Number(form.role_id) });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm, role_id: roles[0]?.id || "" });
      load();
    } catch (err) {
      let message = "Error al guardar el usuario";
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message?.toLowerCase().includes("email")) {
        message = "Correo ya existe";
      }
      setError(message);
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role_id: u.role_id });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUser(id);
      load();
    } catch (err) {
      const message = err.response?.data?.detail || "Error al eliminar el usuario";
      setError(message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Gestión de Usuarios</h1>
      {error && (
        <div style={{
          backgroundColor: "#ffe6e6",
          color: "#cc0000",
          padding: "10px",
          borderRadius: "5px",
          marginBottom: "15px"
        }}>
          ⚠️ {error}
        </div>
      )}

      {!showForm ? (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => { setEditing(null); setForm({ ...emptyForm, role_id: roles[0]?.id || "" }); setShowForm(true); }}
              style={{ backgroundColor: "#007bff", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              + Agregar Usuario
            </button>
            <input
              type="text"
              placeholder="Buscar por nombre o email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ padding: "8px", width: "250px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
          </div>

          <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f2f2f2" }}>
              <tr>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>No hay usuarios</td></tr>
              ) : (
                paginated.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{getRoleName(u.role_id)}</td>
                    <td>
                      <button onClick={() => handleEdit(u)} style={{ marginRight: "5px" }}>✏️ Editar</button>
                      <button onClick={() => handleDelete(u.id)} style={{ color: "red" }}>🗑️ Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
            <span>Página {page} de {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>Siguiente</button>
          </div>
        </>
      ) : (
        <div style={{ maxWidth: "400px" }}>
          <h2>{editing ? "Editar Usuario" : "Nuevo Usuario"}</h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
            <input
              name="name"
              placeholder="Nombre de usuario *"
              value={form.name}
              onChange={handleChange}
              required
              style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <input
              name="email"
              type="email"
              placeholder="Correo electrónico *"
              value={form.email}
              onChange={handleChange}
              required
              style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <input
              name="password"
              type="password"
              placeholder={editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
              value={form.password}
              onChange={handleChange}
              required={!editing}
              style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            <select
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            >
              {roles.length === 0 ? (
                <option value="">Cargando roles...</option>
              ) : (
                roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))
              )}
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                Guardar
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


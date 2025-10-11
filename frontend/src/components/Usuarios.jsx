import { useEffect, useState } from "react";
import '../styles/Usuarios.css';
import axios from 'axios';
import { FaUser, FaEdit, FaSearch } from 'react-icons/fa';

export default function Usuarios({ userID }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);

    // Obtener token del localStorage
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchUsuarioActual();
        fetchUsuarios();
    }, []);

    // Obtener datos del usuario logueado
    const fetchUsuarioActual = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/user`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al obtener usuario actual");
            const data = await res.json();
            setUsuarioActual(data);
        } catch (err) {
            console.error("Error cargando usuario actual:", err);
            setError("No se pudo cargar el usuario actual.");
        }
    };

    // Obtener todos los usuarios
    const fetchUsuarios = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/usuarios", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al obtener usuarios");
            const data = await res.json();
            if (Array.isArray(data)) setUsuarios(data);
            else if (Array.isArray(data.data)) setUsuarios(data.data);
            else setUsuarios([]);
        } catch (err) {
            console.error("Error cargando usuarios:", err);
            setError("No se pudieron cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    };

    // Abrir modal con los datos del usuario seleccionado
    const editarUsuario = (id) => {
        const usuarioSeleccionado = usuarios.find(u => u.id === id);
        if (!usuarioSeleccionado) return;

        setUsuarioEditando({
            ...usuarioSeleccionado,
            activo: Number(usuarioSeleccionado.activo)
        });
    };

    // Manejar cambios en el formulario
    // Detectar cambios en los inputs del modal
    const handleChangeUsuarioEditando = (e) => {
        const { name, value, type } = e.target;

        // Si el campo es "activo", convertir el valor a número
        const newValue = name === "activo"
            ? (value === "1" || value === 1 ? 1 : 0)
            : value;

        setUsuarioEditando((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // Enviar actualización al backend
    const handleActualizarUsuario = async (e) => {
        e.preventDefault();
        if (!usuarioEditando) return;

        // Preparar datos a enviar al backend
        const usuarioData = {
            name: usuarioEditando.name?.trim() || "",
            rol_id: !isNaN(parseInt(usuarioEditando.rol_id)) ? parseInt(usuarioEditando.rol_id) : 1,
            fecha_ingreso: usuarioEditando.fecha_ingreso?.split('T')[0] || null,
            activo: usuarioEditando.activo === 1 || usuarioEditando.activo === "1" ? 1 : 0,
            surnames: usuarioEditando.surnames?.trim() || "", // si está vacío, se envía string vacío
            jefe_directo: usuarioEditando.jefe_directo && !isNaN(parseInt(usuarioEditando.jefe_directo))
                ? parseInt(usuarioEditando.jefe_directo)
                : null,
        };

        try {
            // Enviar PUT al backend
            const res = await axios.put(
                `http://localhost:8000/api/usuarios/${usuarioEditando.id}`,
                usuarioData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar lista de usuarios localmente
            setUsuarios((prev) =>
                prev.map((u) =>
                    u.id === usuarioEditando.id ? (res.data.user || res.data) : u
                )
            );

            setUsuarioEditando(null);
            alert("Usuario actualizado correctamente");

        } catch (error) {
            alert("Error al actualizar usuario. Verifica que los datos sean correctos.");
            console.error("Detalles del error:", error.response?.data || error.message);
        }
    };


    // Filtrar usuarios según rol del usuario logueado
    const usuariosFiltradosPorRol = usuarios.filter(u => {
        if (!usuarioActual) return false;
        if (usuarioActual.rol_id === 3) return true; // Administrador ve todo
        if (usuarioActual.rol_id === 2 && Number(u.jefe_directo) === Number(usuarioActual.id)) return true; // Jefe ve solo sus empleados
        return false;
    });

    // Buscador inteligente
    const usuariosFiltrados = usuariosFiltradosPorRol.filter(u => {
        const texto = busqueda.toLowerCase();

        const rolTexto = (() => {
            switch (u.rol_id) {
                case 1: return "empleado";
                case 2: return "jefe de área";
                case 3: return "administrador";
                default: return "";
            }
        })();

        const activoTexto = u.activo ? "activo" : "inactivo";
        const fechaTexto = new Date(u.fecha_ingreso).toLocaleDateString("es-MX", {
            day: "numeric", month: "long", year: "numeric"
        }).toLowerCase();

        return (
            u.name?.toLowerCase().includes(texto) ||
            u.surnames?.toLowerCase().includes(texto) ||
            u.email?.toLowerCase().includes(texto) ||
            rolTexto.includes(texto) ||
            u.jefe_name?.toLowerCase().includes(texto) ||
            fechaTexto.includes(texto) ||
            activoTexto.includes(texto)
        );
    });

    return (
        <div className="usuarios-wrapper">
            <h2>Lista de Usuarios</h2>

            {/* 🔍 Buscador inteligente */}
            <div className="buscador-container">
                <FaSearch className="icono-buscar" />
                <input
                    type="text"
                    placeholder="Buscar usuario"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="input-busqueda"
                />
            </div>

            {(loading || !usuarioActual) && <p>Cargando usuarios...</p>}
            {!loading && error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && usuarioActual && !error && usuariosFiltrados.length === 0 && (
                <p>No hay usuarios disponibles.</p>
            )}

            {!loading && usuarioActual && !error && usuariosFiltrados.length > 0 && (
                <ul className="usuarios-lista">
                    {usuariosFiltrados.map(u => (
                        <li key={u.id} className="usuario-item">
                            <div className="usuario-header">
                                <FaUser className="icono-usuario" />
                                <div className="info-usuarios">
                                    <p><strong>Nombre:</strong> {u.name} {u.surnames}</p>
                                    <p><strong>Email:</strong> {u.email}</p>
                                    <p><strong>Rol:</strong> {(() => {
                                        switch (u.rol_id) {
                                            case 1: return 'Empleado';
                                            case 2: return 'Jefe de área';
                                            case 3: return 'Administrador';
                                            default: return 'No disponible';
                                        }
                                    })()}</p>

                                    {usuarioActual.rol_id === 3 && u.jefe_name && (
                                        <p><strong>Jefe directo:</strong> {u.jefe_name}</p>
                                    )}

                                    <p><strong>Fecha ingreso:</strong> {new Date(u.fecha_ingreso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p><strong>Estado:</strong> {u.activo ? "Activo" : "Inactivo"}</p>
                                </div>
                            </div>

                            {usuarioActual.rol_id === 3 && (
                                <div className="usuario-actions">
                                    <button onClick={() => editarUsuario(u.id)}>
                                        <FaEdit style={{ marginRight: 6 }} /> Editar
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* 🧾 Modal de edición */}
            {usuarioEditando && (
                <div className="modal-overlay">
                    <div className="modal-editar">
                        <h3>Editar usuario</h3>
                        <form onSubmit={handleActualizarUsuario}>
                            <label>Nombre:</label>
                            <input
                                type="text"
                                name="name"
                                value={usuarioEditando.name}
                                onChange={handleChangeUsuarioEditando}
                            />

                            <label>Apellidos:</label>
                            <input
                                type="text"
                                name="surnames"
                                value={usuarioEditando.surnames || ""}
                                onChange={handleChangeUsuarioEditando}
                            />

                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                title="El correo no es modificable"
                                value={usuarioEditando.email}
                                onChange={handleChangeUsuarioEditando}
                                disabled
                            />

                            <label>Rol:</label>
                            <select
                                name="rol_id"
                                value={usuarioEditando.rol_id}
                                onChange={handleChangeUsuarioEditando}
                            >
                                <option value={1}>Empleado</option>
                                <option value={2}>Jefe de área</option>
                                <option value={3}>Administrador</option>
                            </select>

                            <label>Jefe directo (ID):</label>
                            <input
                                type="number"
                                name="jefe_directo"
                                value={usuarioEditando.jefe_directo || ""}
                                onChange={(e) =>
                                    setUsuarioEditando({
                                        ...usuarioEditando,
                                        jefe_directo: e.target.value === "" ? null : e.target.value
                                    })
                                }
                            />


                            <label>Fecha de ingreso:</label>
                            <input
                                type="date"
                                name="fecha_ingreso"
                                value={usuarioEditando.fecha_ingreso?.split('T')[0] || ""}
                                onChange={handleChangeUsuarioEditando}
                            />

                            <label>Estado:</label>
                            <select
                                value={usuarioEditando.activo} // será 1 o 0
                                onChange={e =>
                                    setUsuarioEditando({ ...usuarioEditando, activo: parseInt(e.target.value) })
                                }
                            >
                                <option value={1}>Activo</option>
                                <option value={0}>Inactivo</option>
                            </select>

                            <div className="modal-botones">
                                <button type="submit">Guardar</button>
                                <button
                                    type="button"
                                    className="cancelar"
                                    onClick={() => setUsuarioEditando(null)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

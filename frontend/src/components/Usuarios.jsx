import { useEffect, useState } from "react";
import "../styles/Usuarios.css";
import axios from "axios";
import { FaUser, FaEdit, FaSearch } from "react-icons/fa";

export default function Usuarios({ userID }) {
    const [usuarios, setUsuarios] = useState([]);
    const [jefes, setJefes] = useState([]); // ✅ lista de jefes disponibles
    const [loading, setLoading] = useState(true);
    const [loadingEditar, setLoadingEditar] = useState(false);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [loadingEliminar, setLoadingEliminar] = useState({});
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchUsuarioActual();
        fetchUsuarios();
    }, []);

    // Obtener usuario logueado
    const fetchUsuarioActual = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/user`, {
                headers: { Authorization: `Bearer ${token}` },
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
            const res = await fetch(`${apiBaseUrl}/api/usuarios`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Error al obtener usuarios");
            const data = await res.json();

            let usuariosData = Array.isArray(data)
                ? data
                : Array.isArray(data.data)
                    ? data.data
                    : [];

            // ✅ Obtener nombre del jefe para cada usuario
            usuariosData = usuariosData.map((u) => {
                const jefe = usuariosData.find((j) => j.id === u.jefe_directo);
                return { ...u, jefe_name: jefe ? jefe.name : null };
            });

            // ✅ Filtrar solo los jefes
            const jefesList = usuariosData.filter((u) => u.rol_id === 2);
            setJefes(jefesList);

            setUsuarios(usuariosData);
        } catch (err) {
            console.error("Error cargando usuarios:", err);
            setError("No se pudieron cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    };

    // Abrir modal
    const editarUsuario = (id) => {
        const usuarioSeleccionado = usuarios.find((u) => u.id === id);
        if (!usuarioSeleccionado) return;

        setUsuarioEditando({
            ...usuarioSeleccionado,
            activo: Number(usuarioSeleccionado.activo),
        });
    };

    const eliminarUsuario = async (id) => {
        const confirmado = window.confirm(
            "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
        );
        if (!confirmado) return; // Si el usuario cancela, no se hace nada

        setLoadingEliminar(prev => ({ ...prev, [id]: true }));
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${apiBaseUrl}/api/usuarios/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Error al eliminar usuario");

            const data = await response.json();
            alert(data.message); // Mensaje de éxito
            fetchUsuarios();     // Actualizar la lista
        } catch (err) {
            console.error("Error eliminando usuario:", err);
            alert("No se pudo eliminar el usuario.");
        } finally {
            setLoadingEliminar(prev => ({ ...prev, [id]: false }));
        }
    };

    // Cambios en formulario
    const handleChangeUsuarioEditando = (e) => {
        const { name, value } = e.target;
        const newValue = name === "activo" ? Number(value) : value;

        setUsuarioEditando((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // Actualizar usuario
    const handleActualizarUsuario = async (e) => {
        e.preventDefault();
        if (!usuarioEditando) return;

        const usuarioData = {
            name: usuarioEditando.name?.trim() || "",
            rol_id: parseInt(usuarioEditando.rol_id) || 1,
            fecha_ingreso: usuarioEditando.fecha_ingreso?.split("T")[0] || null,
            activo: usuarioEditando.activo === 1 || usuarioEditando.activo === "1" ? 1 : 0,
            surnames: usuarioEditando.surnames?.trim() || "",
            jefe_directo: usuarioEditando.jefe_directo
                ? parseInt(usuarioEditando.jefe_directo)
                : null,
        };

        setLoadingEditar(true);
        try {
            const res = await axios.put(
                `${apiBaseUrl}/api/usuarios/${usuarioEditando.id}`,
                usuarioData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Actualizar la lista y recalcular el nombre del jefe
            setUsuarios((prev) =>
                prev.map((u) => {
                    if (u.id === usuarioEditando.id) {
                        const actualizado = res.data.user || res.data;
                        // Buscar el jefe en la lista de usuarios
                        const jefe = prev.find((j) => j.id === actualizado.jefe_directo);
                        return {
                            ...actualizado,
                            jefe_name: jefe ? `${jefe.name} ${jefe.surnames}` : null,
                        };
                    }
                    return u;
                })
            );

            setUsuarioEditando(null);
        } catch (error) {
            alert("Error al actualizar usuario. Verifica que los datos sean correctos.");
            console.error("Detalles del error:", error.response?.data || error.message);
        } finally {
            setLoadingEditar(false);
        }
    };


    // Filtrado por rol
    const usuariosFiltradosPorRol = usuarios.filter((u) => {
        if (!usuarioActual) return false;
        if (usuarioActual.rol_id === 3) return true; // admin
        if (
            usuarioActual.rol_id === 2 &&
            Number(u.jefe_directo) === Number(usuarioActual.id)
        )
            return true; // jefe
        return false;
    });

    // Buscador
    const usuariosFiltrados = usuariosFiltradosPorRol.filter((u) => {
        const esNuevo = u.nuevo === 1 || u.nuevo === "1" || u.nuevo === true;
        if (esNuevo) return false; // Excluir usuarios nuevos

        const texto = busqueda.toLowerCase();
        const rolTexto =
            u.rol_id === 1
                ? "empleado"
                : u.rol_id === 2
                    ? "jefe de área"
                    : "administrador";

        const activoTexto = u.activo ? "activo" : "inactivo";
        const fechaTexto = new Date(u.fecha_ingreso)
            .toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            .toLowerCase();

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

            {/* 🔍 Buscador */}
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
            {!loading && error && <p style={{ color: "red" }}>{error}</p>}
            {!loading &&
                usuarioActual &&
                !error &&
                usuariosFiltrados.length === 0 && (
                    <p>No hay usuarios disponibles.</p>
                )}

            {!loading &&
                usuarioActual &&
                !error &&
                usuariosFiltrados.length > 0 && (
                    <ul className="usuarios-lista">
                        {usuariosFiltrados.map((u) => (
                            <li key={u.id} className="usuario-item">
                                <div className="usuario-header">
                                    <FaUser className="icono-usuario" />
                                    <div className="info-usuarios">
                                        <p>
                                            <strong>Nombre:</strong> {u.name}{" "}
                                            {u.surnames}
                                        </p>
                                        <p>
                                            <strong>Email:</strong> {u.email}
                                        </p>
                                        <p>
                                            <strong>Rol:</strong>{" "}
                                            {u.rol_id === 1
                                                ? "Empleado"
                                                : u.rol_id === 2
                                                    ? "Jefe de área"
                                                    : "Administrador"}
                                        </p>

                                        {usuarioActual.rol_id === 3 && u.jefe_name && (
                                            <p><strong>Jefe directo:</strong> {u.jefe_name}</p>
                                        )}

                                        <p>
                                            <strong>Fecha ingreso:</strong>{" "}
                                            {new Date(
                                                u.fecha_ingreso
                                            ).toLocaleDateString("es-MX", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p>
                                            <strong>Estado:</strong>{" "}
                                            {u.activo
                                                ? "Activo"
                                                : "Inactivo"}
                                        </p>
                                    </div>
                                </div>

                                {usuarioActual.rol_id === 3 && (
                                    <div className="usuario-actions">
                                        <button
                                            onClick={() => eliminarUsuario(u.id)}
                                            disabled={loadingEliminar[u.id]}
                                            className="eliminar"
                                        >
                                            {loadingEliminar[u.id] ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    style={{ margin: 'auto', background: 'none', display: 'block' }}
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 100 100"
                                                    preserveAspectRatio="xMidYMid"
                                                >
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        fill="none"
                                                        stroke="#fff"
                                                        strokeWidth="10"
                                                        r="35"
                                                        strokeDasharray="164.93361431346415 56.97787143782138"
                                                    >
                                                        <animateTransform
                                                            attributeName="transform"
                                                            type="rotate"
                                                            repeatCount="indefinite"
                                                            dur="1s"
                                                            values="0 50 50;360 50 50"
                                                            keyTimes="0;1"
                                                        />
                                                    </circle>
                                                </svg>
                                            ) : (
                                                'Eliminar'
                                            )}
                                        </button>
                                        <button
                                            onClick={() => editarUsuario(u.id)}
                                            className="aprobar"
                                        >
                                            <FaEdit
                                                style={{ marginRight: 6 }}
                                            />{" "}
                                            Editar
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

            {/* 🧾 Modal */}
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
                                disabled={loadingEditar}
                                required
                            />

                            <label>Apellidos:</label>
                            <input
                                type="text"
                                name="surnames"
                                value={usuarioEditando.surnames || ""}
                                onChange={handleChangeUsuarioEditando}
                                disabled={loadingEditar}
                                required
                            />

                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                title="El correo no es modificable"
                                value={usuarioEditando.email}
                                disabled
                            />

                            <label>Rol:</label>
                            <select
                                name="rol_id"
                                value={usuarioEditando.rol_id}
                                onChange={handleChangeUsuarioEditando}
                                disabled={loadingEditar}
                            >
                                <option value={1}>Empleado</option>
                                <option value={2}>Jefe de área</option>
                                <option value={3}>Administrador</option>
                            </select>

                            {/* ✅ Select de jefes */}
                            <label>Jefe directo:</label>
                            <select
                                name="jefe_directo"
                                value={usuarioEditando.jefe_directo || ""}
                                onChange={handleChangeUsuarioEditando}
                                disabled={loadingEditar}
                            >
                                <option value="">Sin jefe directo</option>
                                {jefes.map((j) => (
                                    <option key={j.id} value={j.id}>
                                        {j.name} {j.surnames}
                                    </option>
                                ))}
                            </select>

                            <label>Fecha de ingreso:</label>
                            <input
                                type="date"
                                name="fecha_ingreso"
                                value={
                                    usuarioEditando.fecha_ingreso?.split(
                                        "T"
                                    )[0] || ""
                                }
                                onChange={handleChangeUsuarioEditando}
                                disabled={loadingEditar}
                                required
                            />

                            <label>Estado:</label>
                            <select
                                name="activo"
                                value={usuarioEditando.activo}
                                onChange={handleChangeUsuarioEditando}
                                disabled={loadingEditar}
                            >
                                <option value={1}>Activo</option>
                                <option value={0}>Inactivo</option>
                            </select>

                            <div className="modal-botones">
                                <button type="submit" disabled={loadingEditar}>
                                    {loadingEditar ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{ margin: 'auto', background: 'none', display: 'block' }}
                                            width="24"
                                            height="24"
                                            viewBox="0 0 100 100"
                                            preserveAspectRatio="xMidYMid"
                                        >
                                            <circle
                                                cx="50"
                                                cy="50"
                                                fill="none"
                                                stroke="#fff"
                                                strokeWidth="10"
                                                r="35"
                                                strokeDasharray="164.93361431346415 56.97787143782138"
                                            >
                                                <animateTransform
                                                    attributeName="transform"
                                                    type="rotate"
                                                    repeatCount="indefinite"
                                                    dur="1s"
                                                    values="0 50 50;360 50 50"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                        </svg>
                                    ) : (
                                        'Guardar'
                                    )}
                                </button>
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

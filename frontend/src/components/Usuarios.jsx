import { useEffect, useState } from "react";
import '../styles/Usuarios.css';
import { FaUser, FaEdit, FaSearch } from 'react-icons/fa';

export default function Usuarios({ userID }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        fetchUsuarioActual();
        fetchUsuarios();
    }, []);

    // Obtener datos del usuario logueado
    const fetchUsuarioActual = async () => {
        try {
            const token = localStorage.getItem("token");
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
            const token = localStorage.getItem("token");
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

    const editarUsuario = (id) => {
        alert(`Editar usuario con ID: ${id}`);
    };

    // Filtrar usuarios según rol del usuario logueado
    const usuariosFiltradosPorRol = usuarios.filter(u => {
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

            {/* Mensajes de carga o error */}
            {(loading || !usuarioActual) && <p>Cargando usuarios...</p>}
            {!loading && error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Mensaje si no hay usuarios filtrados */}
            {!loading && usuarioActual && !error && usuariosFiltrados.length === 0 && (
                <p>No hay usuarios disponibles.</p>
            )}

            {/* Lista de usuarios filtrados */}
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
        </div>
    );

}


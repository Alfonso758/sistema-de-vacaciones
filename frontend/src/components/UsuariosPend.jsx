import { useEffect, useState } from "react";
import '../styles/UsuariosPend.css';
import { FaUser } from 'react-icons/fa';

export default function UsuariosPend({ userID }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [loadingBoton, setLoadingBoton] = useState({});
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const rolesMap = {
        1: 'Empleado',
        2: 'Jefe de área',
        3: 'Administrador'
    };


    useEffect(() => {
        fetchUsuarioActual();
        fetchUsuarios();
    }, []);

    const fetchUsuarioActual = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${apiBaseUrl}/api/user`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al obtener usuario actual");
            const data = await res.json();
            setUsuarioActual(data);
        } catch (err) {
            console.error("Error cargando usuario actual:", err);
        }
    };

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${apiBaseUrl}/api/usuarios/pendientes`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Error al obtener usuarios");
            const data = await response.json();
            console.log("Usuarios recibidos:", data.data);
            setUsuarios(data.data || []);
        } catch (err) {
            console.error("Error cargando usuarios:", err);
        } finally {
            setLoading(false);
        }
    };

    const aprobarUsuario = async (id) => {
        setLoadingBoton(prev => ({ ...prev, [id]: true }));
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${apiBaseUrl}/api/usuarios/${id}/activar`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ activo: 1, nuevo: false })
            });
            if (!response.ok) throw new Error("Error al aprobar usuario");
            const data = await response.json();
            alert(data.message);
            fetchUsuarios();
        } catch (err) {
            console.error("Error aprobando usuario:", err);
        } finally {
            setLoadingBoton(prev => ({ ...prev, [id]: false })); // ← resetea solo este
        }
    };

    // Filtramos usuarios con seguridad: convertir activo y nuevo a booleanos
    const usuariosFiltrados = usuarios.filter(u => {
        if (!usuarioActual) return false;

        const activo = Number(u.activo) === 0;
        const nuevo = u.nuevo === true || u.nuevo === 1 || u.nuevo === "1";

        return activo && nuevo;
    });

    return (
        <div className="usuarios-pend-wrapper">
            <h2>Usuarios nuevos</h2>

            {loading || !usuarioActual ? (
                <p>Cargando usuarios nuevos...</p>
            ) : null}

            {!loading && usuarioActual && usuariosFiltrados.length === 0 && (
                <p>No hay usuarios nuevos.</p>
            )}

            {!loading && usuarioActual && usuariosFiltrados.length > 0 && (
                <ul className="usuarios-lista">
                    {usuariosFiltrados.map((u) => (
                        <li key={u.id} className="usuario-item">
                            <div className="usuario-header">
                                <FaUser className="icono-usuario" />
                                <div className="info-usuarios">
                                    <p><strong>Nombre:</strong> {u.name} {u.surnames}</p>
                                    <p><strong>Email:</strong> {u.email}</p>
                                    <p>
                                        <strong>Fecha ingreso:</strong>{" "}
                                        {u.fecha_ingreso
                                            ? new Date(u.fecha_ingreso).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })
                                            : 'No registrada'}
                                    </p>
                                    <p><strong>Rol:</strong> {rolesMap[u.rol_id] || 'Desconocido'}</p>
                                    {u.jefe_name && (
                                        <p><strong>Jefe:</strong> {u.jefe_name}</p>
                                    )}
                                </div>

                            </div>

                            <div className="usuario-actions">
                                <button onClick={() => aprobarUsuario(u.id)} disabled={loadingBoton[u.id]}>
                                    {loadingBoton[u.id] ? (
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
                                        'Aprobar'
                                    )}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

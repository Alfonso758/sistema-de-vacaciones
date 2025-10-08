import { useEffect, useState } from "react";
import '../styles/UsuariosPend.css';
import { FaUser } from 'react-icons/fa';

export default function UsuariosPend({ userID }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usuarioActual, setUsuarioActual] = useState(null);

    useEffect(() => {
        fetchUsuarioActual();
        fetchUsuarios();
    }, []);

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
        }
    };

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/api/usuarios/pendientes", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Error al obtener usuarios");
            const data = await response.json();
            setUsuarios(data.data || []);
        } catch (err) {
            console.error("Error cargando usuarios:", err);
        } finally {
            setLoading(false);
        }
    };

    const aprobarUsuario = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/api/usuarios/${id}/rol`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ rol_id: 1 })
            });
            if (!response.ok) throw new Error("Error al aprobar usuario");
            const data = await response.json();
            alert(data.message);
            fetchUsuarios();
        } catch (err) {
            console.error("Error aprobando usuario:", err);
        }
    };

    const asignarRol = async (id, nuevoRol) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8000/api/usuarios/${id}/rol`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ rol_id: nuevoRol })
            });
            if (!response.ok) throw new Error("Error al asignar rol");
            const data = await response.json();
            alert(data.message);
            fetchUsuarios();
        } catch (err) {
            console.error("Error asignando rol:", err);
        }
    };

    if (loading) return <p>Cargando usuarios pendientes...</p>;
    if (!usuarioActual) return <p>Cargando usuarios pendientes...</p>;

    // Filtramos los usuarios según rol y jefe
    const usuariosFiltrados = usuarios.filter(u => {
        if (usuarioActual.rol_id === 2) return u.rol_id === 5 && u.jefe_directo === usuarioActual.id;
        if (usuarioActual.rol_id === 3) return u.rol_id === 5;
        return false;
    });

    return (
        <div className="usuarios-pend-wrapper">
            <h2>Usuarios pendientes</h2>
            {usuariosFiltrados.length === 0 ? (
                <p>No hay usuarios pendientes.</p>
            ) : (
                <ul className="usuarios-lista">
                    {usuariosFiltrados.map((u) => {
                        const mostrarBotonAprobar =
                            (usuarioActual.rol_id === 2 && u.jefe_directo === usuarioActual.id) ||
                            (usuarioActual.rol_id === 3 && u.jefe_directo);

                        const mostrarSelectAsignar = usuarioActual.rol_id === 3 && !u.jefe_directo;

                        return (
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


                                        {/* Mostrar jefe solo si el usuario no tiene jefe o el usuario logueado NO es supervisor */}
                                        {(u.jefe_directo && usuarioActual.rol_id !== 2) && (
                                            <p><strong>Jefe:</strong> {u.jefe_name || 'No asignado'}</p>
                                        )}
                                    </div>

                                </div>

                                <div className="usuario-actions">
                                    {mostrarBotonAprobar && (
                                        <button onClick={() => aprobarUsuario(u.id)}>Aprobar</button>
                                    )}
                                    {mostrarSelectAsignar && (
                                        <select onChange={(e) => asignarRol(u.id, e.target.value)} defaultValue="">
                                            <option value="" disabled>Asignar rol</option>
                                            <option value="2">Jefe de área</option>
                                            <option value="3">Administrador</option>
                                        </select>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

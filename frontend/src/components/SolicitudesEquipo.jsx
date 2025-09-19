import { useEffect, useState } from "react";
import '../styles/SolicitudesEquipo.css';
import { FaCalendarAlt, FaClock, FaUser, FaComment } from 'react-icons/fa';

export default function SolicitudesEquipo({ userID }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comentarios, setComentarios] = useState({});
    const [filtro, setFiltro] = useState('1');

    const estados = {
        1: "Pendiente",
        2: "Aprobada",
        3: "Rechazada",
        4: "Cancelada"
    };

    // ----------------- FORMATEO DE FECHAS -----------------
    const formatDate = (fechaStr) => {
        if (!fechaStr) return "";
        const fecha = new Date(fechaStr);
        let formatoFecha = new Intl.DateTimeFormat("es-ES", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(fecha);
        formatoFecha = formatoFecha.charAt(0).toUpperCase() + formatoFecha.slice(1);

        const formatoHora = new Intl.DateTimeFormat("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }).format(fecha);

        if (fecha.getHours() === 0 && fecha.getMinutes() === 0) {
            return formatoFecha.replace(",", "");
        }

        return `${formatoFecha.replace(",", "")} - ${formatoHora}`;
    };

    const formatDateSinHora = (fechaStr) => {
        if (!fechaStr) return "";
        const fecha = new Date(fechaStr);
        let formatoFecha = new Intl.DateTimeFormat("es-ES", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(fecha);
        return formatoFecha.charAt(0).toUpperCase() + formatoFecha.slice(1);
    };

    // ----------------- APROBAR O RECHAZAR -----------------
    const manejarDecision = async (id, decision) => {
        try {
            const res = await fetch(`http://localhost:8000/api/solicitudes/${id}/decision`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    decision,
                    comentario: comentarios[id] || "",
                    revisor_id: userID
                }),
            });

            if (!res.ok) throw new Error('Error al actualizar la solicitud');

            const data = await res.json();
            console.log('Solicitud actualizada', data);

            setSolicitudes(solicitudes.map(s =>
                s.id === id ? { ...s, estado_solicitud: decision, comentario: comentarios[id] || "", revisor: data.revisor } : s
            ));
        } catch (error) {
            console.error(error);
        }
    };

    // ----------------- CARGA DE SOLICITUDES DE EMPLEADOS -----------------
    useEffect(() => {
        if (!userID) return;

        fetch(`http://localhost:8000/api/solicitudes/equipo/${userID}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log("Solicitudes de empleados:", data);
                const lista = Array.isArray(data) ? data : [];
                setSolicitudes(lista);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error cargando solicitudes:", err);
                setSolicitudes([]);
                setLoading(false);
            });
    }, [userID]);

    // ----------------- FILTRADO -----------------
    const solicitudesFiltradas = filtro ? solicitudes.filter(s => String(s.estado_solicitud) === filtro) : solicitudes;

    // ----------------- RENDER -----------------
    return (
        <div className="seccion-lista">
            <h2>Solicitudes de mi equipo</h2>

            {/* Filtros */}
            <div className="filtros-solicitudes">
                <button onClick={() => setFiltro('1')} className={filtro === '1' ? 'activo' : ''}>Pendientes</button>
                <button onClick={() => setFiltro('2')} className={filtro === '2' ? 'activo' : ''}>Aprobadas</button>
                <button onClick={() => setFiltro('3')} className={filtro === '3' ? 'activo' : ''}>Rechazadas</button>
            </div>

            <div className="lista-solicitudes">
                {loading ? (
                    <p>Cargando solicitudes...</p>
                ) : solicitudesFiltradas.length === 0 ? (
                    <p>No hay solicitudes en este estado.</p>
                ) : (
                    solicitudesFiltradas.slice().reverse().map((solicitud, index, arr) => (
                        <div
                            key={solicitud.id}
                            className={`tarjeta-solicitud ${estados[solicitud.estado_solicitud]?.toLowerCase()}`}
                        >
                            {/* Cabecera */}
                            <div className="cabecera-solicitud">
                                <span className="numero">#{arr.length - index}</span>
                                <div className="fecha-estado">
                                    <span className="fecha gris">
                                        <FaCalendarAlt style={{ marginRight: '5px' }} />
                                        {formatDate(solicitud.fecha_solicitud)}
                                    </span>
                                    <span className={`estado ${estados[solicitud.estado_solicitud]?.toLowerCase()}`}>
                                        <span className={`estado-indicador ${estados[solicitud.estado_solicitud]?.toLowerCase()}`}></span>
                                        {estados[solicitud.estado_solicitud]}
                                    </span>
                                </div>
                            </div>

                            {/* Info del empleado */}
                            {solicitud.usuario && (
                                <p><FaUser style={{ marginRight: '5px' }} /> <strong>{solicitud.usuario.name}</strong></p>
                            )}

                            {/* Fechas de inicio y fin */}
                            <div className="fechas-solicitud">
                                <span>
                                    <FaClock style={{ marginRight: '5px' }} />
                                    <strong>Inicio:</strong> {formatDateSinHora(solicitud.fecha_inicio)}
                                </span>
                                <span>
                                    <FaClock style={{ marginRight: '5px' }} />
                                    <strong>Fin:</strong> {formatDateSinHora(solicitud.fecha_fin)}
                                </span>
                            </div>

                            {(solicitud.estado_solicitud === 2 || solicitud.estado_solicitud === 3) && (
                                <div className="revision-respuesta">
                                    {/* Revisor a la izquierda */}
                                    {solicitud.revisor && (
                                        <span className="revisor-info">
                                            <FaUser style={{ marginRight: '5px' }} />
                                            <strong>Revisado por:</strong> {solicitud.revisor.name}
                                        </span>
                                    )}

                                    {/* Fecha de respuesta a la derecha */}
                                    <span className="fecha-respuesta">
                                        <FaCalendarAlt style={{ marginRight: '5px' }} />
                                        {formatDate(solicitud.fecha_respuesta || solicitud.updated_at)}
                                    </span>
                                </div>
                            )}



                            {/* Comentarios existentes */}
                            {solicitud.comentario && (
                                <div className="comentario-contenedor">
                                    <label>Comentarios:</label>
                                    <div className="comentario">
                                        <FaComment style={{ marginRight: '5px' }} /> {solicitud.comentario}
                                    </div>
                                </div>
                            )}

                            {/* Acciones solo si está pendiente */}
                            {solicitud.estado_solicitud === 1 && (
                                <div className="acciones-solicitud">
                                    <textarea
                                        placeholder="Agregar un comentario (opcional)"
                                        value={comentarios[solicitud.id] || ""}
                                        onChange={(e) => setComentarios({ ...comentarios, [solicitud.id]: e.target.value })}
                                    />

                                    <button
                                        className="btn aprobar"
                                        onClick={() => manejarDecision(solicitud.id, 2)}
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        className="btn rechazar"
                                        onClick={() => manejarDecision(solicitud.id, 3)}
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

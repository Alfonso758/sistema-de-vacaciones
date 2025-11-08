import { useEffect, useState } from "react";
import '../styles/SolicitudesEquipo.css';
import { FaCalendarAlt, FaClock, FaUser, FaComment, FaSync } from 'react-icons/fa';

export default function SolicitudesEquipo({ userID }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingBoton, setLoadingBoton] = useState({});
    const [comentarios, setComentarios] = useState({});
    const [filtro, setFiltro] = useState('1');
    const [rolID, setRolID] = useState(null);
    const [jefe, setJefe] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL;

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
        // Mensaje dinámico según el tipo de acción
        const mensaje =
            decision === 2
                ? "¿Deseas aprobar esta solicitud? Una vez aprobada, no podrás revertir la acción."
                : "¿Deseas rechazar esta solicitud? Esta acción no se puede deshacer.";

        // Mostrar confirmación antes de proceder
        const confirmar = window.confirm(mensaje);
        if (!confirmar) return;

        const accion = decision === 2 ? 'aprobar' : 'rechazar';
        setLoadingBoton(prev => ({ ...prev, [id]: accion }));

        try {
            const res = await fetch(`${apiBaseUrl}/api/solicitudes/${id}/decision`, {
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

            setSolicitudes(solicitudes.map(s =>
                s.id === id
                    ? { ...s, estado_solicitud: decision, comentario: comentarios[id] || "", revisor: data.revisor }
                    : s
            ));

            // Mensaje de éxito
            alert(decision === 2 ? "Solicitud aprobada." : "Solicitud rechazada.");
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al procesar la solicitud. Intenta nuevamente.");
        } finally {
            setLoadingBoton(prev => ({ ...prev, [id]: null }));
        }
    };

    // ----------------- CARGA DE SOLICITUDES DE EMPLEADOS -----------------
    useEffect(() => {
        if (!userID) return;

        fetch(`${apiBaseUrl}/api/solicitudes/equipo/${userID}`, {
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

    useEffect(() => {
        if (!userID) return;

        fetch(`${apiBaseUrl}/api/usuarios/${userID}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setRolID(data.rol_id);
                    setJefe(data.jefe || null); // 🔹 asume que el backend devuelve un objeto jefe
                }
            })
            .catch(err => console.error("Error cargando usuario:", err));
    }, [userID]);

    // ----------------- FILTRADO -----------------
    const solicitudesFiltradas = filtro ? solicitudes.filter(s => String(s.estado_solicitud) === filtro) : solicitudes;

    // ----------------- RENDER -----------------
    return (
        <div className="seccion-lista">
            <h2>Solicitudes de empleados</h2>

            {/* Filtros y botón de recarga */}
            <div className="filtros-solicitudes">
                <button onClick={() => setFiltro('1')} className={filtro === '1' ? 'activo' : ''}>Pendientes</button>
                <button onClick={() => setFiltro('2')} className={filtro === '2' ? 'activo' : ''}>Aprobadas</button>
                <button onClick={() => setFiltro('3')} className={filtro === '3' ? 'activo' : ''}>Rechazadas</button>

                {/* Botón de recarga */}
                <button
                    className="btn-recargar"
                    onClick={() => {
                        setLoading(true);
                        fetch(`${apiBaseUrl}/api/solicitudes/equipo/${userID}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        })
                            .then(res => res.json())
                            .then(data => {
                                const lista = Array.isArray(data) ? data : [];
                                setSolicitudes(lista);
                                setLoading(false);
                            })
                            .catch(err => {
                                console.error("Error cargando solicitudes:", err);
                                setSolicitudes([]);
                                setLoading(false);
                            });
                    }}
                >
                    <FaSync className={loading ? "girando" : ""} />
                </button>
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

                            {/* Contenedor de info de empleado y jefe */}
                            <div className="info-empleado">
                                {/* Info del empleado */}
                                {solicitud.usuario && (
                                    <p className="nombre-empleado">
                                        <FaUser style={{ marginRight: '5px' }} />
                                        <strong>{solicitud.usuario.name} {solicitud.usuario.surnames}</strong>
                                    </p>
                                )}

                                {/* Mostrar el jefe del empleado de la solicitud si el usuario actual tiene rol 3 */}
                                {rolID === 3 && solicitud.usuario?.jefe && (
                                    <p className="info-jefe">
                                        <FaUser style={{ marginRight: '5px' }} />
                                         <strong className="label-jefe">Jefe:</strong> {solicitud.usuario.jefe.name} {solicitud.usuario.jefe.surnames}
                                    </p>
                                )}
                            </div>

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
                                            <strong>Revisado por:</strong> {solicitud.revisor.name} {solicitud.revisor.surnames}
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
                                    <div className="comentario-container">
                                        <textarea
                                            id="comentario"
                                            placeholder="Agrega un comentario (opcional)"
                                            disabled={loadingBoton[solicitud.id]}
                                        />
                                    </div>


                                    <button
                                        className="btn aprobar"
                                        onClick={() => manejarDecision(solicitud.id, 2)}
                                        disabled={loadingBoton[solicitud.id]}
                                    >
                                        {loadingBoton[solicitud.id] === 'aprobar' ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ margin: 'auto', display: 'block', background: 'none' }}
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
                                        ) : 'Aprobar'}
                                    </button>
                                    <button
                                        className="btn rechazar"
                                        onClick={() => manejarDecision(solicitud.id, 3)}
                                        disabled={loadingBoton[solicitud.id]}
                                    >
                                        {loadingBoton[solicitud.id] === 'rechazar' ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ margin: 'auto', display: 'block', background: 'none' }}
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
                                        ) : 'Rechazar'}
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

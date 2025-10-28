import { useEffect, useState } from "react";
import '../styles/SolicitudesEquipo.css';
import { FaCalendarAlt, FaClock, FaUser, FaComment, FaSync } from 'react-icons/fa';

export default function SolicitudesJefes({ userID }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingBoton, setLoadingBoton] = useState({});
    const [filtro, setFiltro] = useState('2'); // por defecto aprobadas
    const [comentarios, setComentarios] = useState({});
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const estados = {
        2: "Aprobada",
        3: "Rechazada"
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

    // ----------------- FUNCIÓN DE CARGA -----------------
    const cargarSolicitudes = async () => {
        if (!userID) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/solicitudes/jefes/${userID}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            console.log("Solicitudes de jefes:", data);
            setSolicitudes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error cargando solicitudes:", err);
            setSolicitudes([]);
        } finally {
            setLoading(false);
        }
    };

    // ----------------- USEEFFECT -----------------
    useEffect(() => {
        cargarSolicitudes();
    }, [userID]);

    // ----------------- FILTRADO -----------------
    const solicitudesFiltradas = filtro
        ? solicitudes.filter(s => String(s.estado_solicitud) === filtro)
        : solicitudes;

    // ----------------- VALIDAR 72 HORAS -----------------
    const dentroDe72Horas = (fechaSolicitud) => {
        const fecha = new Date(fechaSolicitud);
        const ahora = new Date();
        const diffHoras = (ahora - fecha) / (1000 * 60 * 60);
        return diffHoras <= 72;
    };

    // ----------------- RECHAZAR SOLICITUD -----------------
    const rechazarSolicitud = async (id) => {
        const accion = 'rechazar';
        setLoadingBoton(prev => ({ ...prev, [id]: accion }));
        try {
            const res = await fetch(`${apiBaseUrl}/api/solicitudes/${id}/decision`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    decision: 3, // 3 = Rechazada
                    comentario: comentarios[id] || "",
                    revisor_id: userID
                }),
            });

            if (!res.ok) throw new Error('Error al rechazar la solicitud');

            const data = await res.json();
            console.log('Solicitud rechazada', data);

            setSolicitudes(solicitudes.map(s =>
                s.id === id ? { ...s, estado_solicitud: 3, comentario: comentarios[id] || "", revisor: data.revisor } : s
            ));
        } catch (error) {
            console.error(error);
            alert("Error al rechazar la solicitud.");
        } finally {
            setLoadingBoton(prev => ({ ...prev, [id]: null }));
        }
    };

    // ----------------- RENDER -----------------
    return (
        <div className="seccion-lista">
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Solicitudes de jefes de área</span>
            </h2>

            {/* Filtros (solo aprobadas y rechazadas) */}
            <div className="filtros-solicitudes">
                <button onClick={() => setFiltro('2')} className={filtro === '2' ? 'activo' : ''}>Aprobadas</button>
                <button onClick={() => setFiltro('3')} className={filtro === '3' ? 'activo' : ''}>Rechazadas</button>

                {/* Botón de recarga */}
                <button
                    className="btn-recargar"
                    onClick={cargarSolicitudes}
                    title="Recargar solicitudes"
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

                            {solicitud.usuario && (
                                <p><FaUser style={{ marginRight: '5px' }} /> <strong>{solicitud.usuario.name} {solicitud.usuario.surnames}</strong></p>
                            )}

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

                            {solicitud.estado_solicitud === 3 && (
                                <div className="revision-respuesta">
                                    {solicitud.revisor && (
                                        <span className="revisor-info">
                                            <FaUser style={{ marginRight: '5px' }} />
                                            <strong>Revisado por:</strong> {solicitud.revisor.name} {solicitud.revisor.surnames}
                                        </span>
                                    )}
                                    <span className="fecha-respuesta">
                                        <FaCalendarAlt style={{ marginRight: '5px' }} />
                                        {formatDate(solicitud.fecha_respuesta || solicitud.updated_at)}
                                    </span>
                                </div>
                            )}

                            {solicitud.estado_solicitud === 2 && dentroDe72Horas(solicitud.fecha_solicitud) && (
                                <div className="acciones-solicitud">
                                    <div className="comentario-container">
                                        <textarea
                                            placeholder="Agrega un comentario (opcional)"
                                            value={comentarios[solicitud.id] || ""}
                                            onChange={(e) =>
                                                setComentarios({ ...comentarios, [solicitud.id]: e.target.value })
                                            }
                                            style={{ flex: 1, marginRight: '8px', minHeight: '40px', borderRadius: '16px', padding: '5px' }}
                                            disabled={loadingBoton[solicitud.id]}
                                        />
                                    </div>
                                    <button
                                        className="btn rechazar"
                                        onClick={() => rechazarSolicitud(solicitud.id)}
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

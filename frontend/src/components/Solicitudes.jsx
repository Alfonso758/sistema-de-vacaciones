import { useEffect, useState } from "react";
import '../styles/Solicitudes.css';
import { FaCalendarAlt, FaClock, FaUser, FaComment } from 'react-icons/fa';

export default function Solicitudes({ userID }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    const estados = {
        1: "Pendiente",
        2: "Aprobada",
        3: "Rechazada",
        4: "Cancelada"
    };

    // Función para fechas con hora (ya existente)
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

    // Nueva función solo fecha sin hora
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


    useEffect(() => {
        if (!userID) return; // evita fetch si userID no está definido

        fetch(`http://localhost:8000/api/solicitudes/${userID}`)
            .then(res => res.json())
            .then(data => {
                setSolicitudes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error cargando solicitudes:", err);
                setLoading(false);
            });
    }, [userID]);

    if (loading) return <p>Cargando solicitudes...</p>;

    if (solicitudes.length === 0)
        return <p>No tienes solicitudes registradas.</p>;

    return (
        <div className="seccion-lista">
            <h2>Solicitudes</h2>
            <div className="lista-solicitudes">
                {solicitudes.slice().reverse().map((solicitud, index, arr) => (
                    <div
                        key={solicitud.id}
                        className={`tarjeta-solicitud ${estados[solicitud.estado_solicitud]?.toLowerCase() === 'cancelada' ? 'cancelada' : ''}`}
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
                                    {estados[solicitud.estado_solicitud] || 'Pendiente'}
                                </span>
                            </div>
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

                        {/* Revisión y respuesta */}
                        {(solicitud.revisado_por || solicitud.fecha_respuesta) && (
                            <>
                                <label>Revisado por: </label>
                                <div className="revision-respuesta">
                                    {solicitud.revisado_por && (
                                        <span>
                                            <FaUser style={{ marginRight: '5px' }} /> {solicitud.revisado_por}
                                        </span>
                                    )}
                                    {solicitud.fecha_respuesta && (
                                        <span className="fecha-respuesta">{formatDate(solicitud.fecha_respuesta)}</span>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Comentario */}
                        {solicitud.comentario && (
                            <div className="comentario-contenedor">
                                <label>Comentarios:</label>
                                <div className="comentario">
                                    <FaComment style={{ marginRight: '5px' }} /> {solicitud.comentario}
                                </div>
                            </div>
                        )}

                        {/* Botones de acción según estado */}
                        <div className="acciones-solicitud">
                            {estados[solicitud.estado_solicitud] === 'Pendiente' && (
                                <>
                                    <button className="btn editar">Editar</button>
                                    <button className="btn eliminar">Cancelar</button>
                                </>
                            )}
                            {(estados[solicitud.estado_solicitud] === 'Rechazada' ||
                                estados[solicitud.estado_solicitud] === 'Cancelada') && (
                                    <button className="btn eliminar">Eliminar</button>
                                )}
                            {/* Aprobada no muestra botones */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

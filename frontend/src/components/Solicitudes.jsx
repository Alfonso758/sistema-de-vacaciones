import { useEffect, useState } from "react";
import '../styles/Solicitudes.css';
import { FaCalendarAlt, FaClock, FaUser, FaComment } from 'react-icons/fa'

export default function Solicitudes({ userID }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const estados = {
        1: "Pendiente",
        2: "Aprobada",
        3: "Rechazada",
        4: "Cancelada"
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
            <h2>Solicitudes Enviadas</h2>
            <div className="lista-solicitudes">
                {solicitudes.map((solicitud, index) => (
                    <div key={solicitud.id} className="tarjeta-solicitud">
                        {/* Cabecera */}
                        <div className="cabecera-solicitud">
                            <span className="numero">#{index + 1}</span>
                            <div className="fecha-estado">
                                <span className="fecha gris">
                                    <FaCalendarAlt style={{ marginRight: '5px' }} />
                                    Martes {solicitud.fecha_solicitud} 05:23 a.m.
                                </span>
                                <span className={`estado ${estados[solicitud.estado_solicitud]?.toLowerCase()}`}>
                                    <span className={`estado-indicador ${estados[solicitud.estado_solicitud]?.toLowerCase()}`}></span>
                                    {estados[solicitud.estado_solicitud] || 'Pendiente'}
                                </span>

                            </div>
                        </div>

                        {/* Fechas de inicio y fin */}
                        <div className="fechas-solicitud">
                            <span><FaClock style={{ marginRight: '5px' }} /><strong>Inicio:</strong> Miercoles {solicitud.fecha_inicio}</span>
                            <span><FaClock style={{ marginRight: '5px' }} /><strong>Fin:</strong> Viernes {solicitud.fecha_fin}</span>
                        </div>

                        {/* Revisión y respuesta */}
                        <label>Revisado por: </label>
                        <div className="revision-respuesta">
                            <span><FaUser style={{ marginRight: '5px' }} /> {solicitud.revisado_por ? solicitud.revisado_por : 'No revisado'}</span>
                            <span className="fecha-respuesta">{solicitud.fecha_respuesta ? solicitud.fecha_respuesta : 'Sin fecha'}</span>
                        </div>

                        {/* Comentario */}
                        <label>Comentarios: </label>
                        <div className="comentario">
                            <FaComment style={{ marginRight: '5px' }} /> {solicitud.comentario ? solicitud.comentario : 'Sin comentarios'}
                        </div>

                        {/* Botones de acción */}
                        <div className="acciones-solicitud">
                            <button className="btn editar">Editar</button>
                            <button className="btn eliminar">Eliminar</button>
                        </div>
                    </div>
                ))}
            </div><br></br><br></br><br></br>
        </div>
    );

}

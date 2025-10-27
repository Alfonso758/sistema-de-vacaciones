import { useEffect, useState } from "react";
import '../styles/Solicitudes.css';
import { FaCalendarAlt, FaClock, FaUser, FaComment } from 'react-icons/fa';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);


export default function Solicitudes({ userID }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rolID, setRolID] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [diasInhabilesBD, setDiasInhabilesBD] = useState([]);
    const [mensajeError, setMensajeError] = useState("");
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (!userID) return;

        fetch(`${apiBaseUrl}/api/usuarios/${userID}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setRolID(data.rol_id);
            })
            .catch(err => console.error("Error obteniendo rol del usuario:", err));
    }, [userID]);

    // Obtener días inhábiles desde el backend
    useEffect(() => {
        const fetchDiasInhabiles = async () => {
            try {
                const respuesta = await fetch(`${apiBaseUrl}/api/dias-inhabiles`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!respuesta.ok) throw new Error('Error al obtener días inhábiles');
                const data = await respuesta.json();

                // Guardar los días en el estado
                setDiasInhabilesBD(data);
            } catch (err) {
                console.error("Error cargando días inhábiles:", err);
            }
        };

        fetchDiasInhabiles();
    }, [apiBaseUrl]);

    const menosDe48Horas = (fecha) => {
        if (!fecha) return false;
        const fechaSolicitud = new Date(fecha);
        const ahora = new Date();
        const diferenciaHoras = (ahora - fechaSolicitud) / (1000 * 60 * 60);
        return diferenciaHoras < 48;
    };


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

    // Función para editar la solicitud
    const [modalEditarOpen, setModalEditarOpen] = useState(false);
    const [solicitudEditando, setSolicitudEditando] = useState(null);

    const manejarEditar = async (id) => {
        try {
            // Obtener la solicitud
            const respuestaSolicitud = await fetch(`${apiBaseUrl}/api/solicitudes/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!respuestaSolicitud.ok) throw new Error('Error al obtener la solicitud');

            const solicitud = await respuestaSolicitud.json();

            // 🔹 Obtener datos de vacaciones del usuario
            const respuestaVacaciones = await fetch(`${apiBaseUrl}/api/datos-vacaciones/${userID}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!respuestaVacaciones.ok) throw new Error('Error al obtener datos de vacaciones');

            const datosVacaciones = await respuestaVacaciones.json();

            const diasDisponibles = datosVacaciones.diasDisponibles ?? 0;

            // 🔹 Normalizar fechas para input tipo "date"
            const formatDateInput = (fecha) => {
                if (!fecha) return "";
                return new Date(fecha).toISOString().split("T")[0];
            };

            setSolicitudEditando({
                ...solicitud,
                fecha_inicio: formatDateInput(solicitud.fecha_inicio),
                fecha_fin: formatDateInput(solicitud.fecha_fin),
                dias_disponibles: diasDisponibles
            });

            setModalEditarOpen(true);

        } catch (err) {
            console.error(err);
            alert('No se pudo cargar la solicitud para edición.');
        }
    };


    // Función para cancelar la solicitud (cambiar estado a 'Cancelada')
    const manejarCancelar = async (id) => {
        if (!window.confirm("¿Seguro que deseas cancelar esta solicitud?")) return;

        try {
            const respuesta = await fetch(`${apiBaseUrl}/api/solicitudes/${id}/cancelar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!respuesta.ok) throw new Error('Error al cancelar la solicitud');

            // Actualizar la lista de solicitudes localmente
            setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado_solicitud: 4 } : s));
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Función para eliminar la solicitud
    const manejarEliminar = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta solicitud?")) return;

        try {
            const respuesta = await fetch(`${apiBaseUrl}/api/solicitudes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!respuesta.ok) throw new Error('Error al eliminar la solicitud');

            // Quitar la solicitud de la lista localmente
            setSolicitudes(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };


    useEffect(() => {
        if (!userID) return;

        fetch(`${apiBaseUrl}/api/solicitudes/usuario/${userID}`)
            .then(res => res.json())
            .then(data => {
                console.log("Respuesta API:", data);

                // Si data es un array, usarlo directamente; si es un objeto, ponerlo dentro de un array
                const lista = Array.isArray(data) ? data : [data];

                setSolicitudes(lista);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error cargando solicitudes:", err);
                setSolicitudes([]);
                setLoading(false);
            });
    }, [userID]);

    const parseFechaLocal = (fechaStr) => {
        if (!fechaStr) return null;
        const [yyyy, mm, dd] = fechaStr.split("-").map(Number);
        return new Date(yyyy, mm - 1, dd); // mes 0-indexado
    };


    return (
        <div className="seccion-lista">
            <h2>Solicitudes</h2>

            {/* Mensaje de carga */}
            {loading && <p>Cargando solicitudes...</p>}

            {/* Mensaje si no hay solicitudes */}
            {!loading && (!Array.isArray(solicitudes) || solicitudes.length === 0) && (
                <p>No tienes solicitudes registradas.</p>
            )}

            {/* Lista de solicitudes */}
            {!loading && Array.isArray(solicitudes) && solicitudes.length > 0 && (
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
                            {(solicitud.revisor || solicitud.fecha_respuesta) && (
                                <div className="revision-respuesta">
                                    {solicitud.revisor && (
                                        <span className="revisor-info">
                                            <FaUser style={{ marginRight: '5px' }} />
                                            <strong>Revisado por:</strong> {solicitud.revisor.name} {solicitud.revisor.surnames}
                                        </span>
                                    )}
                                    {solicitud.fecha_respuesta && (
                                        <span className="fecha-respuesta">
                                            <FaCalendarAlt style={{ marginRight: '5px' }} />
                                            {formatDate(solicitud.fecha_respuesta)}
                                        </span>
                                    )}
                                </div>
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

                            {/* Botones de acción */}
                            <div className="acciones-solicitud">
                                {(estados[solicitud.estado_solicitud] === 'Pendiente' ||
                                    (estados[solicitud.estado_solicitud] === 'Aprobada' &&
                                        rolID === 2 &&
                                        menosDe48Horas(solicitud.fecha_solicitud))) && (
                                        <>
                                            {estados[solicitud.estado_solicitud] === 'Pendiente' && (
                                                <button className="btn editar" onClick={() => manejarEditar(solicitud.id)}>Editar</button>
                                            )}
                                            <button className="btn eliminar" onClick={() => manejarCancelar(solicitud.id)}>Cancelar</button>
                                        </>
                                    )}

                                {estados[solicitud.estado_solicitud] === 'Cancelada' && (
                                    <button className="btn eliminar" onClick={() => manejarEliminar(solicitud.id)}>Eliminar</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de edición */}
            {modalEditarOpen && solicitudEditando && (
                <div className="modal-fondo" onClick={() => setModalEditarOpen(false)}>
                    <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                        <h2>Editar Solicitud</h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setModalLoading(true);
                            setMensajeError(""); // limpiar mensaje anterior

                            const inicio = new Date(solicitudEditando.fecha_inicio);
                            const fin = new Date(solicitudEditando.fecha_fin);
                            const hoy = new Date();

                            // 🔸 Validar que la fecha fin no sea antes de inicio
                            if (fin < inicio) {
                                setMensajeError("La fecha de fin no puede ser anterior a la fecha de inicio.");
                                setModalLoading(false);
                                return;
                            }

                            // 🔸 Validar anticipación mínima de 2 meses
                            const diferenciaMeses =
                                (inicio.getFullYear() - hoy.getFullYear()) * 12 + (inicio.getMonth() - hoy.getMonth());
                            if (diferenciaMeses < 2) {
                                setMensajeError("Las vacaciones deben solicitarse al menos con 2 meses de anticipación.");
                                setModalLoading(false);
                                return;
                            }


                            // 🔹 2. CALCULAR DÍAS HÁBILES EXCLUYENDO SÁBADOS, DOMINGOS E INHÁBILES
                            let totalDias = 0;

                            // Crear dayjs desde string 'YYYY-MM-DD' para evitar desfases de zona horaria
                            let diaActual = dayjs(solicitudEditando.fecha_inicio, 'YYYY-MM-DD');
                            const finInclusive = dayjs(solicitudEditando.fecha_fin, 'YYYY-MM-DD').add(1, 'day');

                            while (diaActual.isBefore(finInclusive, 'day')) {
                                const diaSemana = diaActual.day(); // 0=domingo, 6=sábado

                                // Omitir fines de semana
                                if (diaSemana === 0 || diaSemana === 6) {
                                    diaActual = diaActual.add(1, 'day');
                                    continue;
                                }

                                // Verificar si es día inhábil
                                const esInhabil = diasInhabilesBD.some(dia => {
                                    const fechaDia = dayjs(dia.fecha, 'YYYY-MM-DD');
                                    if (dia.siempre === 1) {
                                        // Comparar solo día y mes
                                        return fechaDia.date() === diaActual.date() && fechaDia.month() === diaActual.month();
                                    } else {
                                        // Comparar fecha completa
                                        return fechaDia.isSame(diaActual, 'day');
                                    }
                                });

                                if (!esInhabil) totalDias++;

                                diaActual = diaActual.add(1, 'day');
                            }





                            // 🔸 Simulamos que tienes una variable de días disponibles
                            const diasDisponibles = solicitudEditando.dias_disponibles;

                            // 🔸 Validar que no supere los días disponibles
                            if (totalDias > diasDisponibles) {
                                setMensajeError(`No puedes solicitar ${totalDias} días. Solo tienes ${diasDisponibles} disponibles.`);
                                setModalLoading(false);
                                return;
                            }

                            // 🔹 Si todo está bien, guardar los cambios
                            try {
                                const respuesta = await fetch(`${apiBaseUrl}/api/solicitudes/${solicitudEditando.id}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    },
                                    body: JSON.stringify({
                                        fecha_inicio: solicitudEditando.fecha_inicio,
                                        fecha_fin: solicitudEditando.fecha_fin,
                                        total_dias: totalDias // 🔹 nuevo campo total_dias
                                    })
                                });

                                if (!respuesta.ok) throw new Error('Error al actualizar la solicitud');

                                setModalEditarOpen(false);

                                // Actualiza la solicitud localmente
                                setSolicitudes(prev => prev.map(s =>
                                    s.id === solicitudEditando.id
                                        ? {
                                            ...s,
                                            fecha_inicio: parseFechaLocal(solicitudEditando.fecha_inicio),
                                            fecha_fin: parseFechaLocal(solicitudEditando.fecha_fin),
                                            total_dias: totalDias
                                        }
                                        : s
                                ));

                            } catch (err) {
                                console.error(err);
                                setMensajeError("No se pudo actualizar la solicitud.");
                            } finally {
                                setModalLoading(false);
                            }
                        }}>

                            <div className="input-group">
                                <label>Fecha de Inicio</label>
                                <input
                                    type="date"
                                    value={solicitudEditando.fecha_inicio}
                                    onChange={(e) => setSolicitudEditando({ ...solicitudEditando, fecha_inicio: e.target.value })}
                                    disabled={modalLoading}
                                />
                            </div>

                            <div className="input-group">
                                <label>Fecha de Fin</label>
                                <input
                                    type="date"
                                    value={solicitudEditando.fecha_fin}
                                    onChange={(e) => setSolicitudEditando({ ...solicitudEditando, fecha_fin: e.target.value })}
                                    disabled={modalLoading}
                                />
                            </div>

                            <div className="botones-modal">
                                <button type="submit" className="btn-guardar1" disabled={modalLoading}>
                                    {modalLoading ? (
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

                                <button type="button" className="btn-cancelar1" onClick={() => setModalEditarOpen(false)} disabled={modalLoading}>
                                    Cancelar
                                </button>
                            </div>
                            {mensajeError && (
                                <div className="mensaje-error">
                                    <p>{mensajeError}</p>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

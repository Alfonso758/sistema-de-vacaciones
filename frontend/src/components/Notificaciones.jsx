import React, { useState, useEffect } from "react";
import "../styles/Notificaciones.css";

export default function Notificaciones({ userID }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const fetchNotificaciones = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/notificaciones?userID=${userID}`);
                const data = await response.json();

                // Filtrar solo las notificaciones del usuario actual
                const notis = data
                    .filter(n => n.id_usuario === userID)
                    .map(n => ({
                        id: n.id,
                        titulo: n.titulo,
                        mensaje: n.mensaje,
                        fecha: n.fecha_envio,
                        visto: n.leido === 1
                    }))
                    // Ordenar de la más nueva a la más antigua
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

                setNotificaciones(notis);
            } catch (error) {
                console.error("Error al cargar notificaciones:", error);
            } finally {
                setCargando(false);
            }
        };

        fetchNotificaciones();
    }, [userID]);

    const marcarVisto = async (id) => {
        const noti = notificaciones.find(n => n.id === id);
        if (!noti.visto) {
            try {
                await fetch(`http://localhost:8000/api/notificaciones/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ leido: 1 })
                });

                setNotificaciones(prev =>
                    prev.map(n => n.id === id ? { ...n, visto: true } : n)
                );
            } catch (error) {
                console.error("Error al marcar notificación como vista:", error);
            }
        }
    };

    const eliminarNotificacion = async (id) => {
        try {
            await fetch(`http://localhost:8000/api/notificaciones/${id}`, {
                method: "DELETE",
            });

            setNotificaciones(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error al eliminar notificación:", error);
        }
    };

    const formatoFechaHora = (fechaStr) => {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="seccion-notificaciones">
            <h2>Notificaciones</h2>
            {cargando ? (
                <div className="cargando-container">
                    <p className="cargando-texto">Cargando notificaciones...</p>
                </div>
            ) : (
                <>
                    {notificaciones.map((noti) => (
                        <div
                            key={noti.id}
                            className={`tarjeta-notificacion ${noti.visto ? "visto" : "novista"}`}
                            onClick={() => marcarVisto(noti.id)}
                            title={!noti.visto ? "Marcar como leído" : "Ya leída"}
                        >
                            <div className="cabecera-notificacion">
                                <h3>{noti.titulo}</h3>
                                <span className="fecha-notificacion">{formatoFechaHora(noti.fecha)}</span>
                                <span
                                    className="eliminar-notificacion"
                                    onClick={(e) => { e.stopPropagation(); eliminarNotificacion(noti.id); }}
                                >
                                    ×
                                </span>
                            </div>
                            <p>{noti.mensaje}</p>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

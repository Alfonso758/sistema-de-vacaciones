import React, { useState, useEffect } from "react";
import "../styles/Notificaciones.css";

export default function Notificaciones({ userID }) {
    const [notificaciones, setNotificaciones] = useState([]);

    useEffect(() => {
        const ejemplo = [
            { id: 1, titulo: "Nueva solicitud", mensaje: "Tienes una solicitud pendiente de aprobación.", fecha: "2025-09-01T09:30:00", visto: false },
            { id: 2, titulo: "Actualización de perfil", mensaje: "Tu perfil ha sido actualizado correctamente.", fecha: "2025-08-30T14:20:00", visto: true },
            { id: 3, titulo: "Recordatorio", mensaje: "No olvides enviar tu reporte semanal.", fecha: "2025-08-31T18:00:00", visto: false },
        ];
        setNotificaciones(ejemplo);
    }, []);

    const marcarVisto = (id) => {
        setNotificaciones(prev =>
            prev.map(n => n.id === id ? { ...n, visto: true } : n)
        );
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
            {notificaciones.map((noti) => (
                <div
                    key={noti.id}
                    className={`tarjeta-notificacion ${noti.visto ? "visto" : "novista"}`}
                    onClick={() => marcarVisto(noti.id)}
                >
                    <div className="cabecera-notificacion">
                        <h3>{noti.titulo}</h3>
                        <span className="fecha-notificacion">{formatoFechaHora(noti.fecha)}</span>
                    </div>
                    <p>{noti.mensaje}</p>
                </div>
            ))}
        </div>
    );
}





/*const marcarVistoDB = async (id) => {
    await fetch(`http://localhost:8000/api/notificaciones/${id}/visto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visto: true })
    });
};*/
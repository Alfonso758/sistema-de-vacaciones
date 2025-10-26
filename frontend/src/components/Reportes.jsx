import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSoko from '../assets/soko.png';
import '../styles/Reportes.css';

export default function Reportes({ userID }) {
    const [solicitudes, setSolicitudes] = useState({
        pendientes: [],
        aprobadas: [],
        rechazadas: []
    });
    const [selectedEmpleado, setSelectedEmpleado] = useState("general");
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                const resSolicitudes = await fetch(`${apiBaseUrl}/api/solicitudes/reporte/${userID}`);
                const dataSolicitudes = await resSolicitudes.json();
                setSolicitudes(dataSolicitudes);

                // Determinar fecha mínima y máxima entre todas las solicitudes
                const todasFechas = [
                    ...dataSolicitudes.pendientes,
                    ...dataSolicitudes.aprobadas,
                    ...dataSolicitudes.rechazadas
                ].map(s => new Date(s.fecha_solicitud));

                if (todasFechas.length > 0) {
                    const minFecha = new Date(Math.min(...todasFechas));
                    const fechaActual = new Date(); // fecha "Hasta" será hoy

                    // Función para formatear fecha en local evitando desfase de timezone
                    const formatearFechaLocal = (d) => {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const dd = String(d.getDate()).padStart(2, "0");
                        return `${yyyy}-${mm}-${dd}`;
                    };

                    setFechaInicio(formatearFechaLocal(minFecha));
                    setFechaFin(formatearFechaLocal(fechaActual));
                }

                // Traer empleados del jefe
                const resEmpleados = await fetch(`${apiBaseUrl}/api/empleados/${userID}`);
                const dataEmpleados = await resEmpleados.json();
                setEmpleados(dataEmpleados);

            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDatos();
    }, [userID]);


    const empleadoSeleccionado = empleados.find(
        e => e.id === parseInt(selectedEmpleado)
    );


    // Función para mostrar nombre completo de empleado
    const nombreCompleto = (usuario) => usuario ? `${usuario.name} ${usuario.surnames}` : "-";

    // Filtrar solicitudes por empleado si no es reporte general
    const filtrarPorEmpleado = (lista) =>
        selectedEmpleado === "general"
            ? lista
            : lista.filter(s => s.usuario.id === parseInt(selectedEmpleado));

    // Función para filtrar también por rango de fechas
    const filtrarPorFechas = (lista) => {
        return lista.filter((s) => {
            // Obtener solo la parte YYYY-MM-DD de la solicitud
            const fecha = s.fecha_solicitud.split('T')[0];

            // Convertir a número para comparar fácilmente
            const numFecha = parseInt(fecha.replace(/-/g, ''));
            const numInicio = fechaInicio ? parseInt(fechaInicio.replace(/-/g, '')) : null;
            const numFin = fechaFin ? parseInt(fechaFin.replace(/-/g, '')) : null;

            if (numInicio && numFecha < numInicio) return false;
            if (numFin && numFecha > numFin) return false; // ✅ ahora incluye la fechaFin exacta
            return true;
        });
    };


    // Aplica ambos filtros: por empleado y por fechas
    const pendientesFiltradas = filtrarPorFechas(filtrarPorEmpleado(solicitudes.pendientes));
    const aprobadasFiltradas = filtrarPorFechas(filtrarPorEmpleado(solicitudes.aprobadas));
    const rechazadasFiltradas = filtrarPorFechas(filtrarPorEmpleado(solicitudes.rechazadas));


    const descargarPDF = () => {
        const doc = new jsPDF();

        // --- Agregar logo ---
        const logoWidth = 50;
        const logoHeight = 12.5; // ajusta según quieras
        doc.addImage(logoSoko, "PNG", doc.internal.pageSize.getWidth() - logoWidth - 14, 10, logoWidth, logoHeight);

        // --- Generar contenido del PDF ---
        generarContenidoPDF(doc);
    };


    // Función separada para todo el contenido del PDF
    const generarContenidoPDF = (doc) => {
        doc.setFontSize(14);
        let startY = 0;

        // Datos del empleado
        if (selectedEmpleado !== "general" && empleadoSeleccionado) {
            doc.text("REPORTE POR EMPLEADO", 14, 22);
            doc.setFontSize(12);
            doc.text(`Del ${formatearFechaInput(fechaInicio)} al ${formatearFechaInput(fechaFin)}`, 14, 28);
            startY = 38;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(`Nombre: ${nombreCompleto(empleadoSeleccionado)}`, 14, startY);
            startY += 6;
            doc.text(`Correo: ${empleadoSeleccionado.email}`, 14, startY);
            startY += 10;
        } else {
            doc.text("REPORTE GENERAL DE EMPLEADOS", 14, 22);
            doc.setFontSize(12);
            doc.text(`Del ${formatearFechaInput(fechaInicio)} al ${formatearFechaInput(fechaFin)}`, 14, 28);
            startY = 38;
        }

        // --- Pendientes ---
        const columnasPend = selectedEmpleado === "general"
            ? ["Empleado", "Fecha solicitud", "Inicio", "Fin"]
            : ["Fecha solicitud", "Inicio", "Fin", "Estado"];

        const dataPend = pendientesFiltradas.map(s =>
            selectedEmpleado === "general"
                ? [nombreCompleto(s.usuario), formatearFechaHora(s.fecha_solicitud), formatearFecha(s.fecha_inicio), formatearFecha(s.fecha_fin)]
                : [formatearFechaHora(s.fecha_solicitud), formatearFecha(s.fecha_inicio), formatearFecha(s.fecha_fin), "Pendiente"]
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Solicitudes pendientes", 14, startY);
        autoTable(doc, {
            head: [columnasPend],
            body: dataPend,
            startY: startY + 5,
        });

        let finalY1 = doc.lastAutoTable.finalY + 10;

        // --- Aprobadas ---
        const columnasAprob = selectedEmpleado === "general"
            ? ["Empleado", "Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"]
            : ["Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"];

        const dataAprob = aprobadasFiltradas.map(s =>
            selectedEmpleado === "general"
                ? [nombreCompleto(s.usuario), formatearFechaHora(s.fecha_solicitud), formatearFecha(s.fecha_inicio), formatearFecha(s.fecha_fin), nombreCompleto(s.revisor), formatearFechaHora(s.fecha_respuesta) || "-"]
                : [formatearFechaHora(s.fecha_solicitud), formatearFecha(s.fecha_inicio), formatearFecha(s.fecha_fin), nombreCompleto(s.revisor), formatearFechaHora(s.fecha_respuesta) || "-"]
        );

        doc.text("Solicitudes aprobadas", 14, finalY1);
        autoTable(doc, {
            head: [columnasAprob],
            body: dataAprob,
            startY: finalY1 + 5,
        });

        let finalY2 = doc.lastAutoTable.finalY + 10;

        // --- Rechazadas ---
        const columnasRech = selectedEmpleado === "general"
            ? ["Empleado", "Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"]
            : ["Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"];

        const dataRech = rechazadasFiltradas.map(s =>
            selectedEmpleado === "general"
                ? [nombreCompleto(s.usuario), formatearFechaHora(s.fecha_solicitud), formatearFecha(s.fecha_inicio), formatearFecha(s.fecha_fin), nombreCompleto(s.revisor), formatearFechaHora(s.fecha_respuesta) || "-"]
                : [formatearFechaHora(s.fecha_solicitud), formatearFecha(s.fecha_inicio), formatearFecha(s.fecha_fin), nombreCompleto(s.revisor), formatearFechaHora(s.fecha_respuesta) || "-"]
        );

        doc.text("Solicitudes rechazadas", 14, finalY2);
        autoTable(doc, {
            head: [columnasRech],
            body: dataRech,
            startY: finalY2 + 5,
        });

        // Guardar PDF
        const nombreArchivo = selectedEmpleado === "general"
            ? "reporte_general de empleados.pdf"
            : `reporte_${nombreCompleto(empleadoSeleccionado)}.pdf`;

        doc.save(nombreArchivo);
    };

    // Función para formatear fechas
    function formatearFecha(fecha) {
        if (!fecha) return "-"; // Por si está vacío o null
        const d = new Date(fecha);
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0"); // Los meses van de 0 a 11
        const año = d.getFullYear();
        return `${dia}/${mes}/${año}`;
    }

    // Función para formatear fecha con hora
    function formatearFechaHora(fecha) {
        if (!fecha) return "-"; // Por si está vacío o null
        const d = new Date(fecha);
        if (isNaN(d)) return "-"; // Por si no se puede convertir a fecha

        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const año = d.getFullYear();
        const horas = String(d.getHours()).padStart(2, "0");
        const minutos = String(d.getMinutes()).padStart(2, "0");

        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    }

    function formatearFechaInput(fecha) {
        if (!fecha) return "-";
        // fecha viene en formato YYYY-MM-DD
        const [año, mes, dia] = fecha.split("-");
        return `${dia}/${mes}/${año}`;
    }

    return (
        <div className="reportes-wrap">
            <h2>Reportes</h2>

            {/* Mensaje de carga */}
            {loading && <p>Cargando reportes...</p>}

            {/* Selector de empleado y botón PDF solo si ya cargaron empleados */}
            {!loading && empleados.length > 0 && (
                <>
                    <label className="selector-empleado" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>Seleccionar reporte:</span>
                        <select
                            value={selectedEmpleado}
                            onChange={(e) => setSelectedEmpleado(e.target.value)}
                        >
                            <option value="general">Reporte general</option>
                            {empleados.map(e => (
                                <option key={e.id} value={e.id}>
                                    Reporte de {e.name} {e.surnames}
                                </option>
                            ))}
                        </select>

                        {/* 🔹 Nuevos inputs para rango de fechas */}
                        <div className="filtros-fecha" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <label>
                                Desde:
                                <input
                                    type="date"
                                    value={fechaInicio || ""}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    style={{ marginLeft: "5px" }}
                                />
                            </label>
                            <label>
                                Hasta:
                                <input
                                    type="date"
                                    value={fechaFin || ""}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    style={{ marginLeft: "5px" }}
                                />
                            </label>
                        </div>
                    </label>

                    <div className="botones-pdf">
                        <button onClick={descargarPDF}>Descargar pdf</button>
                    </div>

                    {/* Reporte por empleado */}
                    {!loading && selectedEmpleado !== "general" && empleadoSeleccionado && (
                        <section className="reporte-empleado">
                            <h2>Reporte por empleado de solicitudes</h2>
                            <p><strong>Nombre:</strong> {nombreCompleto(empleadoSeleccionado)}</p>
                            <p><strong>Correo:</strong> {empleadoSeleccionado.email}</p>

                            {/* Pendientes */}
                            <h3>Solicitudes pendientes</h3>
                            {pendientesFiltradas.length > 0 ? (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Fecha solicitud</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendientesFiltradas.map(s => (
                                                <tr key={s.id}>
                                                    <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                    <td>{formatearFecha(s.fecha_inicio)}</td>
                                                    <td>{formatearFecha(s.fecha_fin)}</td>
                                                    <td>Pendiente</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes pendientes.</p>}

                            {/* Aprobadas */}
                            <h3>Solicitudes aprobadas</h3>
                            {aprobadasFiltradas.length > 0 ? (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Fecha solicitud</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                                <th>Revisado por</th>
                                                <th>Fecha revisión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aprobadasFiltradas.map(s => (
                                                <tr key={s.id}>
                                                    <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                    <td>{formatearFecha(s.fecha_inicio)}</td>
                                                    <td>{formatearFecha(s.fecha_fin)}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{formatearFechaHora(s.fecha_respuesta) || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes aprobadas.</p>}

                            {/* Rechazadas */}
                            <h3>Solicitudes rechazadas</h3>
                            {rechazadasFiltradas.length > 0 ? (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Fecha solicitud</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                                <th>Revisado por</th>
                                                <th>Fecha revisión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rechazadasFiltradas.map(s => (
                                                <tr key={s.id}>
                                                    <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                    <td>{formatearFecha(s.fecha_inicio)}</td>
                                                    <td>{formatearFecha(s.fecha_fin)}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{formatearFechaHora(s.fecha_respuesta) || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes rechazadas.</p>}
                        </section>
                    )}

                    {/* Reporte general */}
                    {!loading && selectedEmpleado === "general" && (
                        <section className="reporte-general">
                            <h2>Reporte general de solicitudes</h2>
                            <h3>Solicitudes pendientes</h3>
                            {pendientesFiltradas.length > 0 ? (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Fecha solicitud</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendientesFiltradas.map(s => (
                                                <tr key={s.id}>
                                                    <td>{nombreCompleto(s.usuario)}</td>
                                                    <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                    <td>{formatearFecha(s.fecha_inicio)}</td>
                                                    <td>{formatearFecha(s.fecha_fin)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes pendientes.</p>}

                            <h3>Solicitudes aprobadas</h3>
                            {aprobadasFiltradas.length > 0 ? (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Fecha solicitud</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                                <th>Revisado por</th>
                                                <th>Fecha revisión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aprobadasFiltradas.map(s => (
                                                <tr key={s.id}>
                                                    <td>{nombreCompleto(s.usuario)}</td>
                                                    <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                    <td>{formatearFecha(s.fecha_inicio)}</td>
                                                    <td>{formatearFecha(s.fecha_fin)}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{formatearFechaHora(s.fecha_respuesta) || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes aprobadas.</p>}

                            <h3>Solicitudes rechazadas</h3>
                            {rechazadasFiltradas.length > 0 ? (
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Fecha solicitud</th>
                                                <th>Inicio</th>
                                                <th>Fin</th>
                                                <th>Revisado por</th>
                                                <th>Fecha revisión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rechazadasFiltradas.map(s => (
                                                <tr key={s.id}>
                                                    <td>{nombreCompleto(s.usuario)}</td>
                                                    <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                    <td>{formatearFecha(s.fecha_inicio)}</td>
                                                    <td>{formatearFecha(s.fecha_fin)}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{formatearFechaHora(s.fecha_respuesta) || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes rechazadas.</p>}
                        </section>
                    )}
                </>
            )}

            {/* Mensaje si no hay empleados */}
            {!loading && empleados.length === 0 && (
                <p>No hay empleados disponibles para mostrar reportes.</p>
            )}
        </div>
    );
}

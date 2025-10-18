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
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                // Traer solicitudes del equipo
                const resSolicitudes = await fetch(`${apiBaseUrl}/api/solicitudes/reporte/${userID}`);
                const dataSolicitudes = await resSolicitudes.json();
                setSolicitudes(dataSolicitudes);

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

    const pendientesFiltradas = filtrarPorEmpleado(solicitudes.pendientes);
    const aprobadasFiltradas = filtrarPorEmpleado(solicitudes.aprobadas);
    const rechazadasFiltradas = filtrarPorEmpleado(solicitudes.rechazadas);

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
        doc.setFontSize(16);
        doc.text("Reporte de solicitudes", 14, 22);

        let startY = 30;

        // Datos del empleado
        if (selectedEmpleado !== "general" && empleadoSeleccionado) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(`Nombre: ${nombreCompleto(empleadoSeleccionado)}`, 14, startY);
            startY += 6;
            doc.text(`Correo: ${empleadoSeleccionado.email}`, 14, startY);
            startY += 10;
        }

        // --- Pendientes ---
        const columnasPend = selectedEmpleado === "general"
            ? ["Empleado", "Fecha solicitud", "Inicio", "Fin"]
            : ["Fecha solicitud", "Inicio", "Fin", "Estado"];

        const dataPend = pendientesFiltradas.map(s =>
            selectedEmpleado === "general"
                ? [nombreCompleto(s.usuario), s.fecha_solicitud, s.fecha_inicio, s.fecha_fin]
                : [s.fecha_solicitud, s.fecha_inicio, s.fecha_fin, "Pendiente"]
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
                ? [nombreCompleto(s.usuario), s.fecha_solicitud, s.fecha_inicio, s.fecha_fin, nombreCompleto(s.revisor), s.fecha_respuesta || "-"]
                : [s.fecha_solicitud, s.fecha_inicio, s.fecha_fin, nombreCompleto(s.revisor), s.fecha_respuesta || "-"]
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
                ? [nombreCompleto(s.usuario), s.fecha_solicitud, s.fecha_inicio, s.fecha_fin, nombreCompleto(s.revisor), s.fecha_respuesta || "-"]
                : [s.fecha_solicitud, s.fecha_inicio, s.fecha_fin, nombreCompleto(s.revisor), s.fecha_respuesta || "-"]
        );

        doc.text("Solicitudes rechazadas", 14, finalY2);
        autoTable(doc, {
            head: [columnasRech],
            body: dataRech,
            startY: finalY2 + 5,
        });

        // Guardar PDF
        const nombreArchivo = selectedEmpleado === "general"
            ? "reporte_general.pdf"
            : `reporte_${nombreCompleto(empleadoSeleccionado)}.pdf`;

        doc.save(nombreArchivo);
    };

    return (
        <div className="reportes-wrap">
            <h2>Reportes</h2>

            {/* Mensaje de carga */}
            {loading && <p>Cargando reportes...</p>}

            {/* Selector de empleado y botón PDF solo si ya cargaron empleados */}
            {!loading && empleados.length > 0 && (
                <>
                    <label className="selector-empleado">
                        Seleccionar reporte:
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
                            {pendientesFiltradas.length > 0 ? (
                                <>
                                    <h3>Solicitudes pendientes</h3>
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
                                                    <td>{s.fecha_solicitud}</td>
                                                    <td>{s.fecha_inicio}</td>
                                                    <td>{s.fecha_fin}</td>
                                                    <td>Pendiente</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes pendientes.</p>}

                            {/* Aprobadas */}
                            {aprobadasFiltradas.length > 0 ? (
                                <>
                                    <h3>Solicitudes aprobadas</h3>
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
                                                    <td>{s.fecha_solicitud}</td>
                                                    <td>{s.fecha_inicio}</td>
                                                    <td>{s.fecha_fin}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{s.fecha_respuesta || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes aprobadas.</p>}

                            {/* Rechazadas */}
                            {rechazadasFiltradas.length > 0 ? (
                                <>
                                    <h3>Solicitudes rechazadas</h3>
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
                                                    <td>{s.fecha_solicitud}</td>
                                                    <td>{s.fecha_inicio}</td>
                                                    <td>{s.fecha_fin}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{s.fecha_respuesta || "-"}</td>
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

                            {pendientesFiltradas.length > 0 ? (
                                <>
                                    <h3>Solicitudes pendientes</h3>
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
                                                    <td>{s.fecha_solicitud}</td>
                                                    <td>{s.fecha_inicio}</td>
                                                    <td>{s.fecha_fin}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes pendientes.</p>}

                            {aprobadasFiltradas.length > 0 ? (
                                <>
                                    <h3>Solicitudes aprobadas</h3>
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
                                                    <td>{s.fecha_solicitud}</td>
                                                    <td>{s.fecha_inicio}</td>
                                                    <td>{s.fecha_fin}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{s.fecha_respuesta || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : <p>No hay solicitudes aprobadas.</p>}

                            {rechazadasFiltradas.length > 0 ? (
                                <>
                                    <h3>Solicitudes rechazadas</h3>
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
                                                    <td>{s.fecha_solicitud}</td>
                                                    <td>{s.fecha_inicio}</td>
                                                    <td>{s.fecha_fin}</td>
                                                    <td>{nombreCompleto(s.revisor)}</td>
                                                    <td>{s.fecha_respuesta || "-"}</td>
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

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
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("todos");
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("todos");
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                const resSolicitudes = await fetch(`${apiBaseUrl}/api/solicitudes/reporte/3`);
                const dataSolicitudes = await resSolicitudes.json();
                setSolicitudes(dataSolicitudes);

                const resUsuarios = await fetch(`${apiBaseUrl}/api/usuarios`);
                const dataUsuarios = await resUsuarios.json();
                setUsuarios(dataUsuarios);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, [userID]);

    // 🔹 Actualizar empleadoSeleccionado según usuarioSeleccionado
    useEffect(() => {
        if (usuarioSeleccionado !== "todos") {
            const empleado = usuarios.find(u => u.id === parseInt(usuarioSeleccionado));
            setEmpleadoSeleccionado(empleado || null);
        } else {
            setEmpleadoSeleccionado(null);
        }
    }, [usuarioSeleccionado, usuarios]);

    const nombreCompleto = (usuario) => usuario ? `${usuario.name} ${usuario.surnames}` : "-";
    const esJefe = (usuario) => usuario?.rol_id === 2;
    const esEmpleado = (usuario) => usuario?.rol_id === 1;

    const usuariosFiltrados = () => {
        if (activeTab === "empleados") return usuarios.filter(esEmpleado);
        if (activeTab === "jefes") return usuarios.filter(esJefe);
        return usuarios;
    };

    const filtrarSolicitudes = (lista) => {
        let filtrada = lista;
        if (activeTab === "empleados") filtrada = filtrada.filter(s => esEmpleado(s.usuario));
        if (activeTab === "jefes") filtrada = filtrada.filter(s => esJefe(s.usuario));
        if (usuarioSeleccionado !== "todos") filtrada = filtrada.filter(s => s.usuario_id === parseInt(usuarioSeleccionado));
        return filtrada;
    };

    const pendientes = filtrarSolicitudes(solicitudes.pendientes);
    const aprobadas = filtrarSolicitudes(solicitudes.aprobadas);
    const rechazadas = filtrarSolicitudes(solicitudes.rechazadas);

    // 🔹 Filtrado por empleado para reporte individual
    const pendientesFiltradas = empleadoSeleccionado ? pendientes.filter(s => s.usuario_id === empleadoSeleccionado.id) : [];
    const aprobadasFiltradas = empleadoSeleccionado ? aprobadas.filter(s => s.usuario_id === empleadoSeleccionado.id) : [];
    const rechazadasFiltradas = empleadoSeleccionado ? rechazadas.filter(s => s.usuario_id === empleadoSeleccionado.id) : [];

    // ------------------ PDF ------------------
    const descargarPDF = () => {
        const doc = new jsPDF();
        const logoWidth = 50;
        const logoHeight = 12.5;
        doc.addImage(logoSoko, "PNG", doc.internal.pageSize.getWidth() - logoWidth - 14, 10, logoWidth, logoHeight);
        generarContenidoPDF(doc);
    };

    const generarContenidoPDF = (doc) => {
        doc.setFontSize(16);
        doc.text(`Reporte de solicitudes - ${activeTab.toUpperCase()} - Usuario: ${usuarioSeleccionado}`, 14, 22);

        let startY = 30;
        const generarTabla = (titulo, lista, columnas, datos) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(titulo, 14, startY);
            autoTable(doc, {
                head: [columnas],
                body: datos,
                startY: startY + 5,
            });
            startY = doc.lastAutoTable.finalY + 10;
        };

        // Pendientes
        if (activeTab !== "jefes") {
            const columnasPend = ["Empleado/Jefe", "Rol", "Fecha solicitud", "Inicio", "Fin", "Jefe directo"];
            const dataPend = pendientes.map(s => [
                nombreCompleto(s.usuario),
                esJefe(s.usuario) ? "Jefe" : "Empleado",
                s.fecha_solicitud,
                s.fecha_inicio,
                s.fecha_fin,
                s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"
            ]);
            generarTabla("Solicitudes pendientes", pendientes, columnasPend, dataPend);
        }

        // Aprobadas
        const columnasAprob = ["Empleado/Jefe", "Rol", "Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"];
        if (activeTab !== "jefes") columnasAprob.push("Jefe directo");
        const dataAprob = aprobadas.map(s => [
            nombreCompleto(s.usuario),
            esJefe(s.usuario) ? "Jefe" : "Empleado",
            s.fecha_solicitud,
            s.fecha_inicio,
            s.fecha_fin,
            nombreCompleto(s.revisor),
            s.fecha_respuesta || "-",
            ...(activeTab !== "jefes" ? [s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"] : [])
        ]);
        generarTabla("Solicitudes aprobadas", aprobadas, columnasAprob, dataAprob);

        // Rechazadas
        const columnasRech = ["Empleado/Jefe", "Rol", "Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"];
        if (activeTab !== "jefes") columnasRech.push("Jefe directo");
        const dataRech = rechazadas.map(s => [
            nombreCompleto(s.usuario),
            esJefe(s.usuario) ? "Jefe" : "Empleado",
            s.fecha_solicitud,
            s.fecha_inicio,
            s.fecha_fin,
            nombreCompleto(s.revisor),
            s.fecha_respuesta || "-",
            ...(activeTab !== "jefes" ? [s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"] : [])
        ]);
        generarTabla("Solicitudes rechazadas", rechazadas, columnasRech, dataRech);

        doc.save(`reporte_${activeTab}_${usuarioSeleccionado}.pdf`);
    };

    return (
        <div className="reportes-wrap">
            <h2>Reportes</h2>

            {/* Mensaje de carga */}
            {loading && <p className="cargando">Cargando reportes...</p>}

            {/* Selector de empleado y botón PDF solo si ya cargaron empleados */}
            {!loading && usuarios.length > 0 && (
                <>

                    {/* Pestañas */}
                    < div className="filtros-solicitudes">
                        <button
                            onClick={() => { setActiveTab("todos"); setUsuarioSeleccionado("todos"); }}
                            className={activeTab === "todos" ? "activo" : ""}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => { setActiveTab("empleados"); setUsuarioSeleccionado("todos"); }}
                            className={activeTab === "empleados" ? "activo" : ""}
                        >
                            Empleados
                        </button>
                        <button
                            onClick={() => { setActiveTab("jefes"); setUsuarioSeleccionado("todos"); }}
                            className={activeTab === "jefes" ? "activo" : ""}
                        >
                            Jefes
                        </button>
                    </div>

                    {/* Select dinámico según pestaña */}
                    {
                        !loading && usuarios.length > 0 && (
                            <div className="filtro-usuario">
                                <label>Seleccionar reporte:
                                    <select value={usuarioSeleccionado} onChange={(e) => setUsuarioSeleccionado(e.target.value)}>
                                        <option value="todos">
                                            {activeTab === "todos"
                                                ? "Reporte general"
                                                : activeTab === "empleados"
                                                    ? "Reporte general de empleados"
                                                    : "Reporte general de jefes de área"}
                                        </option>
                                        {usuariosFiltrados().map(u => (
                                            <option key={u.id} value={u.id}>
                                                Reporte de {`${u.name} ${u.surnames}`}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        )
                    }

                    <div className="botones-pdf">
                        <button onClick={descargarPDF}>Descargar PDF</button>
                    </div>

                    {/* 🔹 Reporte general */}
                    {
                        usuarioSeleccionado === "todos" && (
                            (pendientes.length > 0 || aprobadas.length > 0 || rechazadas.length > 0) && (
                                <section className="reporte-general">
                                    <h2>Reporte de solicitudes ({activeTab})</h2>

                                    {/* Solo mostrar pendientes si NO es pestaña jefes */}
                                    {activeTab !== "jefes" && pendientes.length > 0 && (
                                        <>
                                            <h3>Solicitudes pendientes</h3>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Rol</th>
                                                        <th>Fecha solicitud</th>
                                                        <th>Inicio</th>
                                                        <th>Fin</th>
                                                        <th>Jefe directo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendientes.map(s => (
                                                        <tr key={s.id}>
                                                            <td>{nombreCompleto(s.usuario)}</td>
                                                            <td>{esJefe(s.usuario) ? "Jefe" : "Empleado"}</td>
                                                            <td>{s.fecha_solicitud}</td>
                                                            <td>{s.fecha_inicio}</td>
                                                            <td>{s.fecha_fin}</td>
                                                            <td>{s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}

                                    {/* Aprobadas */}
                                    {aprobadas.length > 0 && (
                                        <>
                                            <h3>Solicitudes aprobadas</h3>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Rol</th>
                                                        <th>Fecha solicitud</th>
                                                        <th>Inicio</th>
                                                        <th>Fin</th>
                                                        <th>Revisado por</th>
                                                        <th>Fecha revisión</th>
                                                        {activeTab !== "jefes" && <th>Jefe directo</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {aprobadas.map(s => (
                                                        <tr key={s.id}>
                                                            <td>{nombreCompleto(s.usuario)}</td>
                                                            <td>{esJefe(s.usuario) ? "Jefe" : "Empleado"}</td>
                                                            <td>{s.fecha_solicitud}</td>
                                                            <td>{s.fecha_inicio}</td>
                                                            <td>{s.fecha_fin}</td>
                                                            <td>{nombreCompleto(s.revisor)}</td>
                                                            <td>{s.fecha_respuesta || "-"}</td>
                                                            {activeTab !== "jefes" && <td>{s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"}</td>}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}

                                    {/* Rechazadas */}
                                    {rechazadas.length > 0 && (
                                        <>
                                            <h3>Solicitudes rechazadas</h3>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Rol</th>
                                                        <th>Fecha solicitud</th>
                                                        <th>Inicio</th>
                                                        <th>Fin</th>
                                                        <th>Revisado por</th>
                                                        <th>Fecha revisión</th>
                                                        {activeTab !== "jefes" && <th>Jefe directo</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rechazadas.map(s => (
                                                        <tr key={s.id}>
                                                            <td>{nombreCompleto(s.usuario)}</td>
                                                            <td>{esJefe(s.usuario) ? "Jefe" : "Empleado"}</td>
                                                            <td>{s.fecha_solicitud}</td>
                                                            <td>{s.fecha_inicio}</td>
                                                            <td>{s.fecha_fin}</td>
                                                            <td>{nombreCompleto(s.revisor)}</td>
                                                            <td>{s.fecha_respuesta || "-"}</td>
                                                            {activeTab !== "jefes" && <td>{s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"}</td>}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </section>
                            )
                        )
                    }

                    {/* 🔹 Reporte por empleado */}
                    {
                        usuarioSeleccionado !== "todos" && empleadoSeleccionado && (
                            <section className="reporte-empleado">
                                <h2>Reporte por empleado de solicitudes</h2>
                                <p><strong>Nombre:</strong> {nombreCompleto(empleadoSeleccionado)}</p>
                                <p><strong>Correo:</strong> {empleadoSeleccionado?.email || "-"}</p>

                                {/* Mostrar jefe si rol_id === 1 */}
                                {empleadoSeleccionado.rol_id === 1 && (
                                    <p>
                                        <strong>Jefe:</strong> {pendientesFiltradas[0]?.usuario?.jefe
                                            ? nombreCompleto(pendientesFiltradas[0].usuario.jefe)
                                            : aprobadasFiltradas[0]?.usuario?.jefe
                                                ? nombreCompleto(aprobadasFiltradas[0].usuario.jefe)
                                                : rechazadasFiltradas[0]?.usuario?.jefe
                                                    ? nombreCompleto(rechazadasFiltradas[0].usuario.jefe)
                                                    : "-"}
                                    </p>
                                )}

                                {/* Pendientes */}
                                {pendientesFiltradas.length > 0 && (
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
                                )}

                                {/* Aprobadas */}
                                {aprobadasFiltradas.length > 0 && (
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
                                )}

                                {/* Rechazadas */}
                                {rechazadasFiltradas.length > 0 && (
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
                                )}
                            </section>
                        )
                    }
                </>
            )}

            {/* Mensaje si no hay usuarios */}
            {
                !loading && usuarios.length === 0 && (
                    <p>No hay usuarios disponibles para mostrar reportes.</p>
                )
            }
        </div>
    );
}

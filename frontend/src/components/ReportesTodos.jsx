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
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                const resSolicitudes = await fetch(`${apiBaseUrl}/api/solicitudes/reporte/3`);
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

    const pendientes = filtrarPorFechas(filtrarSolicitudes(solicitudes.pendientes));
    const aprobadas = filtrarPorFechas(filtrarSolicitudes(solicitudes.aprobadas));
    const rechazadas = filtrarPorFechas(filtrarSolicitudes(solicitudes.rechazadas));

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
        doc.setFontSize(14);
        let titulo = "";
        let nombreArchivo = "";

        // Si es reporte general
        if (usuarioSeleccionado === "todos") {
            if (activeTab === "todos") {
                titulo = "REPORTE GENERAL";
                nombreArchivo = "reporte_general";
            } else if (activeTab === "empleados") {
                titulo = "REPORTE GENERAL DE EMPLEADOS";
                nombreArchivo = "reporte_general de empleados";
            } else if (activeTab === "jefes") {
                titulo = "REPORTE GENERAL DE JEFES DE ÁREA";
                nombreArchivo = "reporte_general de jefes de área";
            }
        }
        // Si es reporte individual
        else {
            const usuario = usuarios.find(u => u.id === parseInt(usuarioSeleccionado));

            function capitalizarNombre(nombre) {
                return nombre
                    .toLowerCase()
                    .replace(/\b\w/g, (letra) => letra.toUpperCase());
            }

            if (usuario) {
                const nombreCompleto = `${usuario.name} ${usuario.surnames}`;
                const nombreCapitalizado = capitalizarNombre(nombreCompleto);
                titulo = `REPORTE DE ${nombreCapitalizado.toUpperCase()}`;
                nombreArchivo = `reporte_${nombreCapitalizado.replace(/\s+/g, " ")}`;
            } else {
                titulo = "REPORTE INDIVIDUAL";
                nombreArchivo = "reporte_individual";
            }
        }
        doc.text(titulo, 14, 22);

        doc.setFontSize(12);
        doc.text(`Del ${formatearFechaInput(fechaInicio)} al ${formatearFechaInput(fechaFin)}`, 14, 28);

        let startY = 38;
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
            const columnasPend = ["Nombre", "Rol", "Fecha solicitud", "Inicio", "Fin", "Jefe directo"];
            const dataPend = pendientes.map(s => [
                nombreCompleto(s.usuario),
                esJefe(s.usuario) ? "Jefe" : "Empleado",
                formatearFechaHora(s.fecha_solicitud),
                formatearFecha(s.fecha_inicio),
                formatearFecha(s.fecha_fin),
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
            formatearFechaHora(s.fecha_solicitud),
            formatearFecha(s.fecha_inicio),
            formatearFecha(s.fecha_fin),
            nombreCompleto(s.revisor),
            formatearFechaHora(s.fecha_respuesta) || "-",
            ...(activeTab !== "jefes" ? [s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"] : [])
        ]);
        generarTabla("Solicitudes aprobadas", aprobadas, columnasAprob, dataAprob);

        // Rechazadas
        const columnasRech = ["Empleado/Jefe", "Rol", "Fecha solicitud", "Inicio", "Fin", "Revisado por", "Fecha revisión"];
        if (activeTab !== "jefes") columnasRech.push("Jefe directo");
        const dataRech = rechazadas.map(s => [
            nombreCompleto(s.usuario),
            esJefe(s.usuario) ? "Jefe" : "Empleado",
            formatearFechaHora(s.fecha_solicitud),
            formatearFecha(s.fecha_inicio),
            formatearFecha(s.fecha_fin),
            nombreCompleto(s.revisor),
            formatearFechaHora(s.fecha_respuesta) || "-",
            ...(activeTab !== "jefes" ? [s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"] : [])
        ]);
        generarTabla("Solicitudes rechazadas", rechazadas, columnasRech, dataRech);

        doc.save(`${nombreArchivo}.pdf`);
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
                            Jefes de área
                        </button>
                    </div>

                    {/* Select dinámico según pestaña */}
                    {!loading && usuarios.length > 0 && (
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

                                    {usuariosFiltrados()
                                        // Si está en la pestaña "todos", filtra los que no son administradores
                                        .filter(u => !(activeTab === "todos" && u.rol_id === 3))
                                        .map(u => (
                                            <option key={u.id} value={u.id}>
                                                Reporte de {`${u.name} ${u.surnames}`}
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
                                    <h3>Solicitudes pendientes</h3>
                                    {activeTab !== "jefes" && pendientes.length > 0 ? (
                                        <>
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
                                                            <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                            <td>{formatearFecha(s.fecha_inicio)}</td>
                                                            <td>{formatearFecha(s.fecha_fin)}</td>
                                                            <td>{s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    ) : <p>No hay solicitudes pendientes.</p>}

                                    {/* Aprobadas */}
                                    <h3>Solicitudes aprobadas</h3>
                                    {aprobadas.length > 0 ? (
                                        <>
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
                                                            <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                            <td>{formatearFecha(s.fecha_inicio)}</td>
                                                            <td>{formatearFecha(s.fecha_fin)}</td>
                                                            <td>{nombreCompleto(s.revisor)}</td>
                                                            <td>{formatearFechaHora(s.fecha_respuesta) || "-"}</td>
                                                            {activeTab !== "jefes" && <td>{s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"}</td>}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    ) : <p>No hay solicitudes aprobadas.</p>}

                                    {/* Rechazadas */}
                                    <h3>Solicitudes rechazadas</h3>
                                    {rechazadas.length > 0 ? (
                                        <>
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
                                                            <td>{formatearFechaHora(s.fecha_solicitud)}</td>
                                                            <td>{formatearFecha(s.fecha_inicio)}</td>
                                                            <td>{formatearFecha(s.fecha_fin)}</td>
                                                            <td>{nombreCompleto(s.revisor)}</td>
                                                            <td>{formatearFechaHora(s.fecha_respuesta) || "-"}</td>
                                                            {activeTab !== "jefes" && <td>{s.usuario?.jefe ? nombreCompleto(s.usuario.jefe) : "-"}</td>}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    ) : <p>No hay solicitudes rechazadas.</p>}
                                </section>
                            )
                        )
                    }

                    {/* 🔹 Reporte por empleado */}
                    {usuarioSeleccionado !== "todos" && empleadoSeleccionado && (
                        <section className="reporte-empleado">
                            <h2>Reporte por empleado de solicitudes</h2>
                            <p><strong>Nombre:</strong> {nombreCompleto(empleadoSeleccionado)}</p>
                            <p><strong>Correo:</strong> {empleadoSeleccionado?.email || "-"}</p>

                            {/* Mostrar jefe si rol_id === 1 */}
                            {empleadoSeleccionado.rol_id === 1 && (
                                <p>
                                    <strong>Jefe:</strong>{" "}
                                    {empleadoSeleccionado.jefe
                                        ? nombreCompleto(empleadoSeleccionado.jefe)
                                        : pendientesFiltradas[0]?.usuario?.jefe
                                            ? nombreCompleto(pendientesFiltradas[0].usuario.jefe)
                                            : aprobadasFiltradas[0]?.usuario?.jefe
                                                ? nombreCompleto(aprobadasFiltradas[0].usuario.jefe)
                                                : rechazadasFiltradas[0]?.usuario?.jefe
                                                    ? nombreCompleto(rechazadasFiltradas[0].usuario.jefe)
                                                    : "-"}
                                </p>
                            )}


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

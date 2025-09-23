import React, { useState, useEffect } from "react";
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

    useEffect(() => {
        const fetchDatos = async () => {
            setLoading(true);
            try {
                // Traer solicitudes del equipo
                const resSolicitudes = await fetch(`http://localhost:8000/api/solicitudes/reporte/${userID}`);
                const dataSolicitudes = await resSolicitudes.json();
                setSolicitudes(dataSolicitudes);

                // Traer empleados del jefe
                const resEmpleados = await fetch(`http://localhost:8000/api/empleados/${userID}`);
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

    if (loading) return <p>Cargando reportes...</p>;

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

    return (
        <div className="reportes-wrap">
            <h2>Reportes</h2>

            <label className="selector-empleado">
                Seleccionar reporte:
                <select
                    value={selectedEmpleado}
                    onChange={(e) => setSelectedEmpleado(e.target.value)}
                >
                    <option value="general">Reporte general</option>
                    {empleados.map(e => (
                        <option key={e.id} value={e.id}>
                            Reporte de {e.name} {e.surnames}  {/* ← aquí estaba e.nombre, se cambia a e.name */}
                        </option>
                    ))}
                </select>

            </label>

            {selectedEmpleado !== "general" && empleadoSeleccionado && (
                <section className="reporte-empleado">
                    <h2>Datos del empleado</h2>
                    <p><strong>Nombre:</strong> {nombreCompleto(empleadoSeleccionado)}</p>
                    <p><strong>Correo:</strong> {empleadoSeleccionado.email}</p>

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
                </section>
            )}

            {selectedEmpleado === "general" && (
                <section className="reporte-general">
                    <h2>Reporte general de solicitudes</h2>

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
                </section>
            )}
        </div>
    );
}

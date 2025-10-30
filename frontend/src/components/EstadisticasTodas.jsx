import { useEffect, useState } from "react";
import '../styles/Estadisticas.css';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

const COLORS = ["#f0ad4e", "#5cb85c", "#d9534f"];

export default function Estadisticas({ userID }) {
    const [datos, setDatos] = useState({
        todos: { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] },
        empleados: { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] },
        jefes: { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] }
    });
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [pestania, setPestania] = useState("todos");
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const fetchDatos = async (anio) => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/estadisticasTodas/${anio}?userID=${userID}`, {
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                credentials: "include"
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Error desconocido");
            }

            const data = await response.json();

            // 🔹 Asegurar que siempre exista la estructura completa
            setDatos({
                todos: data.todos || { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] },
                empleados: data.empleados || { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] },
                jefes: data.jefes || { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] }
            });

        } catch (error) {
            console.error("❌ Error cargando estadísticas:", error);
            setDatos({
                todos: { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] },
                empleados: { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] },
                jefes: { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userID) fetchDatos(year);
    }, [userID, year]);

    const datosActuales = datos[pestania] || { estados: [], aprobadasPorMes: [], rechazadasPorMes: [], usoVacaciones: [] };

    const hasData = (array, key = "value") =>
        Array.isArray(array) && array.some(item => Number(item[key]) > 0);

    return (
        <div className="estadisticas">
            <h2>Estadísticas</h2>
            <div className="selector-anio">
                <button onClick={() => setYear(prev => prev - 1)}>⬅️ {year - 1}</button>
                <span className="anio-actual">{year}</span>
                <button onClick={() => setYear(prev => prev + 1)}>{year + 1} ➡️</button>
            </div>

            <div className="filtros-solicitudes">
                {["todos", "empleados", "jefes"].map(tab => (
                    <button
                        key={tab}
                        className={pestania === tab ? "activo" : ""}
                        onClick={() => setPestania(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ color: '#666', padding: '0px 0' }}>Cargando estadísticas...</p>
            ) : (
                <>
                    {/* Gráfica de estados */}
                    <div className="grafica-pastel">
                        <h3>Estados de solicitudes</h3>
                        {hasData(datosActuales.estados) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datosActuales.estados}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {datosActuales.estados.map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p style={{ textAlign: 'center', color: '#666', padding: '80px 0' }}>No hay datos disponibles</p>}
                    </div>

                    {/* Aprobadas por mes */}
                    <div className="grafica-linea">
                        <h3>Solicitudes aprobadas por mes</h3>
                        {hasData(datosActuales.aprobadasPorMes, "total") ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={datosActuales.aprobadasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#5cb85c" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <p style={{ textAlign: 'center', color: '#666', padding: '60px 0' }}>No hay datos disponibles</p>}
                    </div>

                    {/* Rechazadas por mes */}
                    <div className="grafica-linea">
                        <h3>Solicitudes rechazadas por mes</h3>
                        {hasData(datosActuales.rechazadasPorMes, "total") ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={datosActuales.rechazadasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#d9534f" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <p style={{ textAlign: 'center', color: '#666', padding: '60px 0' }}>No hay datos disponibles</p>}
                    </div>

                    {/* Uso vacaciones */}
                    <div className="grafica-pastel">
                        <h3>Uso promedio de vacaciones</h3>
                        {hasData(datosActuales.usoVacaciones) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datosActuales.usoVacaciones}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                    >
                                        {datosActuales.usoVacaciones.map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => [`${(props.percent * 100).toFixed(1)}%`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p style={{ textAlign: 'center', color: '#666', padding: '80px 0' }}>No hay datos disponibles</p>}
                    </div>
                </>
            )}
        </div>
    );
}

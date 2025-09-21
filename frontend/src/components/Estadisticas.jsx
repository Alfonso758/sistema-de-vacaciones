import { useEffect, useState } from "react";
import '../styles/Estadisticas.css';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

const COLORS = ["#f0ad4e", "#5cb85c", "#d9534f"];

export default function Estadisticas({ userID }) {
    const [datos, setDatos] = useState({
        estados: [],
        aprobadasPorMes: [],
        rechazadasPorMes: [],
        usoVacaciones: []
    });
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [focusedButton, setFocusedButton] = useState(null);

    const fetchDatos = async (anio) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8000/api/estadisticas/${anio}?userID=${userID}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                credentials: "include"
            });

            const data = await response.json();
            setDatos(data);
        } catch (error) {
            console.error("❌ Error cargando estadísticas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userID) fetchDatos(year);
    }, [userID, year]);

    const handleKeyDown = (e) => {
        if (focusedButton === null) return;
        if (e.key === "ArrowLeft") setYear(prev => prev - 1);
        if (e.key === "ArrowRight") setYear(prev => prev + 1);
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedButton]);

    const hasData = (array, key = "value") => 
        array.some(item => Number(item[key]) > 0);

    return (
        <div className="estadisticas">
            {/* Título y selector de año siempre visibles */}
            <h2>Estadísticas</h2>
            <div className="selector-anio" tabIndex={0} onFocus={() => setFocusedButton(true)} onBlur={() => setFocusedButton(null)}>
                <button onClick={() => setYear(year - 1)}>⬅️ {year - 1}</button>
                <span className="anio-actual">{year}</span>
                <button onClick={() => setYear(year + 1)}>{year + 1} ➡️</button>
            </div>

            {/* Contenido de las gráficas */}
            {loading ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>Cargando estadísticas...</p>
            ) : (
                <>
                    {/* Gráfica de estados de solicitudes */}
                    <div className="grafica-pastel">
                        <h3>Estados de solicitudes</h3>
                        {hasData(datos.estados) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datos.estados}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {datos.estados.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', padding: '80px 0' }}>
                                No hay datos disponibles para este año.
                            </p>
                        )}
                    </div>

                    {/* Tendencia aprobadas por mes */}
                    <div className="grafica-linea">
                        <h3>Solicitudes aprobadas por mes</h3>
                        {hasData(datos.aprobadasPorMes, "total") ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={datos.aprobadasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#5cb85c" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', padding: '60px 0' }}>
                                No hay datos disponibles para este año.
                            </p>
                        )}
                    </div>

                    {/* Tendencia rechazadas por mes */}
                    <div className="grafica-linea">
                        <h3>Solicitudes rechazadas por mes</h3>
                        {hasData(datos.rechazadasPorMes, "total") ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={datos.rechazadasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" stroke="#d9534f" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', padding: '60px 0' }}>
                                No hay datos disponibles para este año.
                            </p>
                        )}
                    </div>

                    {/* Uso promedio de vacaciones */}
                    <div className="grafica-pastel">
                        <h3>Uso promedio de vacaciones</h3>
                        {hasData(datos.usoVacaciones) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={datos.usoVacaciones}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {datos.usoVacaciones.map((entry, index) => (
                                            <Cell key={`cell-uso-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', padding: '80px 0' }}>
                                No hay datos disponibles para este año.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

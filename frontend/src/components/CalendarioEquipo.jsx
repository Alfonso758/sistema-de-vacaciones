import React, { useState, useEffect } from "react";
import "../styles/Calendario.css";

const COLORS = [
    "#e53935", "#0087fdff", "#207d25ff", "#fdd835", "#8e24aa",
    "#fb8c00", "#64e0f1ff", "#6d4c41", "#31396fff", "#21ee5bff"
];

export default function Calendario({ userID }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [vacaciones, setVacaciones] = useState([]);
    const [diasInhabiles, setDiasInhabiles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [empleadoColors, setEmpleadoColors] = useState({});
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    let firstDayWeekIndex = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = Array.from({ length: firstDayWeekIndex }, () => null);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = 42;
    const trailingBlanks = Array.from(
        { length: totalCells - leadingBlanks.length - monthDays.length },
        () => null
    );
    const fullCells = [...leadingBlanks, ...monthDays, ...trailingBlanks];

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    const weekdayShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const monthName = new Intl.DateTimeFormat("es-MX", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month, 1)).replace(" de ", " ");

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // 🔹 Traer vacaciones aprobadas del backend
    useEffect(() => {
        const fetchDatos = async () => {
            setCargando(true);
            try {
                let vacData = [];
                if (userID) {
                    const resVac = await fetch(`${apiBaseUrl}/api/vacaciones/${userID}`);
                    vacData = await resVac.json();

                    // asignar colores a empleados únicos
                    const colorMap = {};
                    let colorIndex = 0;
                    vacData.forEach(v => {
                        if (!colorMap[v.usuario_id]) {
                            colorMap[v.usuario_id] = COLORS[colorIndex % COLORS.length];
                            colorIndex++;
                        }
                    });
                    setEmpleadoColors(colorMap);

                    setVacaciones(vacData);
                }

                const resDias = await fetch(`${apiBaseUrl}/api/dias-inhabiles`);
                const diasData = await resDias.json();
                setDiasInhabiles(diasData);

            } catch (error) {
                console.error("Error cargando calendario:", error);
            } finally {
                setCargando(false);
            }
        };

        fetchDatos();
    }, [userID]);

    // 🔹 Atajos teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") prevMonth();
            if (e.key === "ArrowRight") nextMonth();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentDate]);

    // 🔹 Buscar vacaciones que caen en un día
    const getVacacionesByDay = (day) => {
        if (!day) return [];
        const date = new Date(year, month, day);
        return vacaciones.filter(v => {
            const inicio = new Date(v.fecha_inicio);
            const fin = new Date(v.fecha_fin);
            return date >= inicio && date <= fin;
        });
    };

    return (
        <div>
            <h2>Calendario</h2>
            <main className="calendario-wrap">
                {cargando ? (
                    <div className="cargando-calendario">
                        <p className="cargando-texto_calendario">Cargando calendario...</p>
                    </div>
                ) : (
                    <>
                        {/* 🔹 Leyenda de colores */}
                        <div className="calendario-leyenda">
                            {Object.entries(empleadoColors).map(([id, color]) => {
                                const empleado = vacaciones.find(v => v.usuario_id == id);
                                return (
                                    <div key={id} className="leyenda-item">
                                        <span className="color-bolita" style={{ backgroundColor: color }}></span>
                                        <span>{empleado?.nombre || `Empleado ${id}`}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <header className="calendario-header">
                            <button onClick={prevMonth}>&lt;</button>
                            <h1 className="calendario-title">{monthName}</h1>
                            <button onClick={nextMonth}>&gt;</button>
                        </header>

                        <section className="calendario-table">
                            <div className="calendario-weekdays">
                                {weekdayShort.map((wd) => (
                                    <div key={wd} className="calendario-weekday">{wd}</div>
                                ))}
                            </div>

                            <div className="calendario-grid">
                                {fullCells.map((day, idx) => {
                                    const colIndex = idx % 7;
                                    const isWeekendColumn = colIndex === 5 || colIndex === 6;

                                    if (!day) {
                                        return <div key={idx} className={`calendario-cell ${isWeekendColumn ? "fin-de-semana" : ""}`}></div>;
                                    }

                                    const isToday = isCurrentMonth && day === today.getDate();
                                    const isInhabil = diasInhabiles.some(d => {
                                        const dDate = new Date(d.fecha);
                                        if (d.siempre) {
                                            return dDate.getDate() === day && dDate.getMonth() === month;
                                        } else {
                                            return dDate.getDate() === day &&
                                                dDate.getMonth() === month &&
                                                dDate.getFullYear() === year;
                                        }
                                    });

                                    const vacs = !isInhabil ? getVacacionesByDay(day) : [];

                                    return (
                                        <div
                                            key={idx}
                                            className={`calendario-cell 
                      ${isInhabil ? "inhabil" : ""} 
                      ${isWeekendColumn && !isInhabil ? "fin-de-semana" : ""}`}
                                        >
                                            <span className={`${isToday ? "hoy" : ""}`}>{day}</span>
                                            <div className="bolitas-vacaciones">
                                                {vacs.map((v, i) => (
                                                    <span
                                                        key={i}
                                                        className="bolita"
                                                        style={{ backgroundColor: empleadoColors[v.usuario_id] }}
                                                        title={v.nombre}
                                                    ></span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

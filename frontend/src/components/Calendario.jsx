import React, { useState, useEffect } from "react";
import "../styles/Calendario.css";

export default function Calendario({ userID }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [vacaciones, setVacaciones] = useState([]);
    const [diasInhabiles, setDiasInhabiles] = useState([]);
    const [cargando, setCargando] = useState(true); // <-- Estado de carga
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    let firstDayWeekIndex = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = Array.from({ length: firstDayWeekIndex }, () => null);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = 42;
    const trailingBlanks = Array.from({ length: totalCells - leadingBlanks.length - monthDays.length }, () => null);
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
            setCargando(true); // iniciar carga
            try {
                let vacData = [];
                if (userID) {
                    const resVac = await fetch(`${apiBaseUrl}/api/vacacionesPropias/${userID}`);
                    vacData = await resVac.json();
                    setVacaciones(vacData);
                }

                const resDias = await fetch(`${apiBaseUrl}/api/dias-inhabiles`);
                const diasData = await resDias.json();
                setDiasInhabiles(diasData);

            } catch (error) {
                console.error("Error cargando calendario:", error);
            } finally {
                setCargando(false); // terminar carga
            }
        };

        fetchDatos();
    }, [userID]);

    const isVacacionDay = (day) => {
        if (!day) return false;
        const date = new Date(year, month, day);
        return vacaciones.some(v => {
            const inicio = new Date(v.fecha_inicio);
            const fin = new Date(v.fecha_fin);
            return date >= inicio && date <= fin;
        });
    };

    const isDiaInhabilDay = (day) => {
        if (!day) return false;
        const date = new Date(year, month, day);
        return diasInhabiles.some(d => {
            const dDate = new Date(d.fecha);
            if (d.siempre) {
                return dDate.getDate() === date.getDate() && dDate.getMonth() === date.getMonth();
            } else {
                return dDate.getDate() === date.getDate() &&
                    dDate.getMonth() === date.getMonth() &&
                    dDate.getFullYear() === date.getFullYear();
            }
        });
    };

    // 🔹 Atajos teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") prevMonth();
            if (e.key === "ArrowRight") nextMonth();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentDate]);

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
                                    const isInhabil = isDiaInhabilDay(day);
                                    const isVacacion = !isInhabil && !isWeekendColumn && isVacacionDay(day);

                                    return (
                                        <div
                                            key={idx}
                                            className={`calendario-cell 
                                        ${isInhabil ? "inhabil" : ""} 
                                        ${isVacacion ? "vacacion" : ""} 
                                        ${isWeekendColumn && !isInhabil ? "fin-de-semana" : ""}`}
                                        >
                                            <span className={`${isToday ? "hoy" : ""}`}>{day}</span>
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

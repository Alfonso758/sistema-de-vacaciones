import React, { useState, useEffect } from "react";
import "../styles/Calendario.css";

export default function Calendario({ userID }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [vacaciones, setVacaciones] = useState([]);
    const [diasInhabiles, setDiasInhabiles] = useState([]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    let firstDayWeekIndex = firstOfMonth.getDay();
    firstDayWeekIndex = (firstDayWeekIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = Array.from({ length: firstDayWeekIndex }, () => null);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const cells = [...leadingBlanks, ...monthDays];
    const totalCells = 42;
    const trailingBlanks = Array.from({ length: totalCells - cells.length }, () => null);
    const fullCells = [...cells, ...trailingBlanks];

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
        const fetchVacaciones = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/vacaciones/${userID}`);
                const data = await res.json();
                setVacaciones(data);
            } catch (error) {
                console.error("Error cargando vacaciones:", error);
            }
        };
        if (userID) fetchVacaciones();
    }, [userID]);

    // 🔹 Traer días inhábiles del backend
    useEffect(() => {
        const fetchDiasInhabiles = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/dias-inhabiles`);
                const data = await res.json();
                setDiasInhabiles(data);
            } catch (error) {
                console.error("Error cargando días inhábiles:", error);
            }
        };
        fetchDiasInhabiles();
    }, []);

    // 🔹 Función para saber si un día está en vacaciones aprobadas
    const isVacacionDay = (day) => {
        if (!day) return false;
        const date = new Date(year, month, day);
        return vacaciones.some(v => {
            const inicio = new Date(v.fecha_inicio);
            const fin = new Date(v.fecha_fin);
            return date >= inicio && date <= fin;
        });
    };

    // 🔹 Función para saber si un día es inhábil
    const isDiaInhabilDay = (day) => {
        if (!day) return false;
        const date = new Date(year, month, day);

        return diasInhabiles.some(d => {
            const dDate = new Date(d.fecha);
            if (d.siempre) {
                // Comparar solo día y mes
                return dDate.getDate() === date.getDate() && dDate.getMonth() === date.getMonth();
            } else {
                // Comparar día, mes y año
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
        <main className="calendario-wrap">
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
                        // Calcular la columna (0 = lunes, 6 = domingo)
                        const colIndex = idx % 7;
                        const isWeekendColumn = colIndex === 5 || colIndex === 6; // Sábado o Domingo

                        if (!day) {
                            // Celda vacía pero con fondo amarillo si es fin de semana
                            return (
                                <div
                                    key={idx}
                                    className={`calendario-cell ${isWeekendColumn ? "fin-de-semana" : ""}`}
                                ></div>
                            );
                        }

                        const date = new Date(year, month, day);
                        const isToday = isCurrentMonth && day === today.getDate();
                        const isInhabil = isDiaInhabilDay(day);
                        const isVacacion = !isInhabil && !isWeekendColumn && isVacacionDay(day); // solo entre semana y si no es inhábil

                        return (
                            <div
                                key={idx}
                                className={`calendario-cell 
                            ${isInhabil ? "inhabil" : ""} 
                            ${isVacacion ? "vacacion" : ""} 
                            ${isWeekendColumn && !isInhabil ? "fin-de-semana" : ""}`}
                            >
                                <span className={`${isToday ? "hoy" : ""}`}>
                                    {day}
                                </span>
                            </div>
                        );
                    })}
                </div>



            </section>
        </main>
    );
}

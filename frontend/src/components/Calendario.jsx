import React, { useState, useEffect } from "react";
import "../styles/Calendario.css";

export default function Calendario({ userID }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    const firstOfMonth = new Date(year, month, 1);
    let firstDayWeekIndex = firstOfMonth.getDay(); // 0=Domingo
    firstDayWeekIndex = (firstDayWeekIndex + 6) % 7; // Lunes=0, Domingo=6

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

    // Listener para teclas izquierda/derecha
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") prevMonth();
            if (e.key === "ArrowRight") nextMonth();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentDate]); // dependemos de currentDate para actualizar correctamente

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
                        const isToday = isCurrentMonth && day === today.getDate();
                        return (
                            <div key={idx} className={`calendario-cell ${isToday ? "hoy" : ""}`}>
                                {day && <span>{day}</span>}
                            </div>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}


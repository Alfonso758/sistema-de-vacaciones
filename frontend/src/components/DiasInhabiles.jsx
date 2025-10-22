import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/DiasInhabiles.css";

export default function DiasInhabiles() {
    const [dias, setDias] = useState([]);
    const [nombre, setNombre] = useState("");
    const [fecha, setFecha] = useState("");
    const [siempre, setSiempre] = useState(0);
    const [editID, setEditID] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    // Cargar días inhabil
    useEffect(() => {
        fetchDias();
    }, []);

    const fetchDias = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}/api/dias-inhabiles`);
            setDias(res.data);
        } catch (error) {
            console.error("Error al cargar días:", error);
        }
    };

    // Guardar o actualizar
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editID) {
                // Actualizar
                await axios.put(`${apiBaseUrl}/api/dias-inhabiles/${editID}`, {
                    nombre,
                    fecha,
                    siempre,
                });
            } else {
                // Crear nuevo
                await axios.post(`${apiBaseUrl}/api/dias-inhabiles`, {
                    nombre,
                    fecha,
                    siempre,
                });
            }
            setNombre("");
            setFecha("");
            setSiempre(0);
            setEditID(null);
            fetchDias();
        } catch (error) {
            console.error("Error al guardar día:", error);
        }
    };

    // Eliminar
    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este día inhabil?")) return;
        try {
            await axios.delete(`${apiBaseUrl}/api/dias-inhabiles/${id}`);
            fetchDias();
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    // Editar
    const handleEdit = (dia) => {
        setNombre(dia.nombre);

        if (dia.fecha) {
            const date = new Date(dia.fecha);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0"); // Mes inicia en 0
            const dd = String(date.getDate()).padStart(2, "0");

            setFecha(`${yyyy}-${mm}-${dd}`); // Formato YYYY-MM-DD para el input
        } else {
            setFecha("");
        }

        setSiempre(dia.siempre);
        setEditID(dia.id);
    };


    return (
        <div className="dias-container">
            <h2>Días Inhábiles</h2>
            <form onSubmit={handleSubmit} className="dias-form">
                <input
                    type="text"
                    placeholder="Nombre del día"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />
                <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                />

                <label>
                    <input
                        type="checkbox"
                        checked={siempre === 1}
                        onChange={(e) => setSiempre(e.target.checked ? 1 : 0)}
                    />
                    Día inhabil siempre
                </label>
                <button type="submit">{editID ? "Actualizar" : "Agregar"}</button>
                {editID && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditID(null);
                            setNombre("");
                            setFecha("");
                            setSiempre(0);
                        }}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <table className="dias-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Siempre (todos los años)</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(dias) && dias.map((dia) => {
                        // Formatear fecha en español y sin hora
                        const fechaFormateada = dia.fecha
                            ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" })
                                .format(new Date(dia.fecha))
                            : "-";

                        return (
                            <tr key={dia.id}>
                                <td>{dia.nombre}</td>
                                <td>{fechaFormateada}</td>
                                <td>{dia.siempre ? "Sí" : "No"}</td>
                                <td>
                                    <button onClick={() => handleEdit(dia)}>Editar</button>
                                    <button onClick={() => handleDelete(dia.id)}>Eliminar</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

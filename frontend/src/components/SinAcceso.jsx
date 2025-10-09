import { useState, useEffect } from 'react';
import '../styles/SinAcceso.css';

function SinAcceso({ usuario }) {
    const [jefeDirecto, setJefeDirecto] = useState(usuario?.jefe_directo || '');
    const [fechaIngreso, setFechaIngreso] = useState(usuario?.fecha_ingreso || '');
    const [jefes, setJefes] = useState([]);
    const [guardado, setGuardado] = useState(
        localStorage.getItem('formGuardado') === 'true' // 🔹 leer el flag al iniciar
    );

    // Cargar jefes desde el backend
    useEffect(() => {
        fetch('http://localhost:8000/api/jefes')
            .then(res => res.json())
            .then(data => setJefes(data))
            .catch(() => console.error("Error cargando jefes"));
    }, []);

    // Enviar formulario
    const handleRegistro = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/usuarios/${usuario.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    jefe_directo: jefeDirecto,
                    fecha_ingreso: fechaIngreso
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Datos guardados correctamente');
                setGuardado(true);
                localStorage.setItem('formGuardado', 'true'); // 🔹 guardar el flag
            } else {
                alert(data.message || 'Error al guardar los datos');
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión con el servidor');
        }
    };

    return (
        <div className="sin-acceso-wrapper">
            <h2>Bienvenido al sistema de vacaciones Soko Labs</h2>
            <label className="main-label">
                No tienes acceso al sistema hasta que tu jefe directo o un administrador apruebe tu registro.
            </label>

            {(!usuario.jefe_directo || !usuario.fecha_ingreso) && !guardado && (
                <div className="sin-acceso">
                    <form onSubmit={handleRegistro}>
                        <h3>Completa tus datos</h3>

                        {!usuario.jefe_directo && (
                            <div>
                                <label>Jefe directo:</label>
                                <select
                                    value={jefeDirecto}
                                    onChange={(e) => setJefeDirecto(e.target.value)}
                                >
                                    <option value="">Selecciona tu jefe (si aplica)</option>
                                    {jefes.map(j => (
                                        <option key={j.id} value={j.id}>
                                            {j.name} {j.surnames}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {!usuario.fecha_ingreso && (
                            <div>
                                <label>Fecha de ingreso:</label>
                                <input
                                    type="date"
                                    value={fechaIngreso}
                                    onChange={(e) => setFechaIngreso(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <button type="submit">Guardar</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default SinAcceso;

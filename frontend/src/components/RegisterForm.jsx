import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RegisterForm.css';

function RegisterForm() {
    const [form, setForm] = useState({
        name: '',
        surnames: '',
        email: '',
        password: '',
        password_confirmation: '',
        rol_id: '',
        activo: true,
        fecha_ingreso: '',
        jefe_directo: ''
    });

    const [jefes, setJefes] = useState([]);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const apiBaseUrl = import.meta.env.VITE_API_URL;

    // Cargar jefes desde el backend
    useEffect(() => {
        axios.get(`${apiBaseUrl}/api/jefes`)
            .then(res => setJefes(res.data))
            .catch(() => console.error("Error cargando jefes"));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors({});
        setLoading(true); // 🔹 Activa el loading

        try {
            const response = await axios.post(`${apiBaseUrl}/api/register`, form);
            setMessage(response.data.message || 'Usuario registrado');

            // 🔹 Reiniciar formulario después del registro exitoso
            setForm({
                name: '',
                surnames: '',
                email: '',
                password: '',
                password_confirmation: '',
                rol_id: '',
                activo: true,
                fecha_ingreso: '',
                jefe_directo: ''
            });

        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                setMessage('Error al registrar el usuario');
            }
        } finally {
            setLoading(false); // 🔹 Desactiva el loading
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-container">
                <h2>Crear cuenta</h2>
                <p><strong>Nota:</strong> Si eres jefe de área o administrador, deja en blanco la casilla "Selecciona tu jefe".</p>

                <form onSubmit={handleSubmit} className="register-form">

                    <div className='fecha'>
                        <label>Fecha de incorporación a la empresa</label>
                        <input
                            type="date"
                            name="fecha_ingreso"
                            value={form.fecha_ingreso}
                            onChange={handleChange}
                            placeholder="dd/mm/aaaa"
                            required
                            disabled={loading}
                        />
                        {errors.fecha_ingreso && <p className="error">{errors.fecha_ingreso[0]}</p>}
                    </div>

                    <div className="tipo_usuario">
                        <select
                            name="rol_id"
                            value={form.rol_id}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="">Tipo de usuario</option>
                            <option value={1}>Empleado</option>
                            <option value={2}>Jefe de área</option>
                            <option value={3}>Administrador</option>
                        </select>
                        {errors.rol_id && <p className="error">{errors.rol_id[0]}</p>}
                    </div>

                    <input
                        type="text"
                        name="name"
                        placeholder="Nombre"
                        value={form.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    {errors.name && <p className="error">{errors.name[0]}</p>}

                    <input
                        type="text"
                        name="surnames"
                        placeholder="Apellidos"
                        value={form.surnames}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    {errors.surnames && <p className="error">{errors.surnames[0]}</p>}


                    <select
                        name="jefe_directo"
                        value={form.jefe_directo}
                        onChange={handleChange}
                        disabled={loading}
                    >
                        <option value="">Selecciona tu jefe (si aplica)</option>
                        {jefes.map(j => (
                            <option key={j.id} value={j.id}>
                                {j.name} {j.surnames}
                            </option>
                        ))}
                    </select>
                    {errors.jefe_directo && <p className="error">{errors.jefe_directo[0]}</p>}


                    <input
                        type="email"
                        name="email"
                        placeholder="Correo"
                        value={form.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    {errors.email && <p className="error">{errors.email[0]}</p>}

                    <div className="password-wrapper">
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    {errors.password && <p className="error">{errors.password[0]}</p>}

                    <div className="password-wrapper">
                        <input
                            type="password"
                            name="password_confirmation"
                            placeholder="Confirmar contraseña"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ margin: 'auto', background: 'none', display: 'block' }}
                                width="24"
                                height="24"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="xMidYMid"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    fill="none"
                                    stroke="#fff"
                                    strokeWidth="10"
                                    r="35"
                                    strokeDasharray="164.93361431346415 56.97787143782138"
                                >
                                    <animateTransform
                                        attributeName="transform"
                                        type="rotate"
                                        repeatCount="indefinite"
                                        dur="1s"
                                        values="0 50 50;360 50 50"
                                        keyTimes="0;1"
                                    />
                                </circle>
                            </svg>
                        ) : (
                            'Registrarse'
                        )}
                    </button>

                    {message && <p className="message">{message}</p>}
                </form>
            </div>
        </div>
    );
}

export default RegisterForm;

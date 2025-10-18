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
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-container">
                <form onSubmit={handleSubmit} className="register-form">
                    <h2>Crear cuenta</h2>

                    <div className='fecha'>
                        <label>Fecha de incorporación a la empresa</label>
                        <input
                            type="date"
                            name="fecha_ingreso"
                            value={form.fecha_ingreso}
                            onChange={handleChange}
                        />
                        {errors.fecha_ingreso && <p className="error">{errors.fecha_ingreso[0]}</p>}
                    </div>

                    <input
                        type="text"
                        name="name"
                        placeholder="Nombre"
                        value={form.name}
                        onChange={handleChange}
                    />
                    {errors.name && <p className="error">{errors.name[0]}</p>}

                    <input
                        type="text"
                        name="surnames"
                        placeholder="Apellidos"
                        value={form.surnames}
                        onChange={handleChange}
                    />
                    {errors.surnames && <p className="error">{errors.surnames[0]}</p>}

                    <div className="grupo-input">
                        <select
                            name="jefe_directo"
                            value={form.jefe_directo}
                            onChange={handleChange}
                        >
                            <option value="">Selecciona tu jefe (si aplica)</option>
                            {jefes.map(j => (
                                <option key={j.id} value={j.id}>
                                    {j.name} {j.surnames}
                                </option>
                            ))}
                        </select>
                        {errors.jefe_directo && <p className="error">{errors.jefe_directo[0]}</p>}
                    </div>

                    <input
                        type="email"
                        name="email"
                        placeholder="Correo"
                        value={form.email}
                        onChange={handleChange}
                    />
                    {errors.email && <p className="error">{errors.email[0]}</p>}

                    <div className="password-wrapper">
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={handleChange}
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
                        />
                    </div>

                    <button type="submit">Registrarse</button>

                    {message && <p className="message">{message}</p>}
                </form>
            </div>
        </div>
    );
}

export default RegisterForm;

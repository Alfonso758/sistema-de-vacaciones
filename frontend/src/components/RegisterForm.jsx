import React, { useState } from 'react';
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
        activo: true
    });

    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors({});

        try {
            const response = await axios.post('http://localhost:8000/api/register', form);
            setMessage(response.data.message);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                setMessage('Error al registrar el usuario');
            }
        }
    };

    return (
        <div className="form-wrapper">
            <form onSubmit={handleSubmit} className="register-form">
                <h2>Crear cuenta </h2>

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
                    name="surnames" // ✅ Igual que en la BD
                    placeholder="Apellidos"
                    value={form.surnames}
                    onChange={handleChange}
                />
                {errors.surnames && <p className="error">{errors.surnames[0]}</p>}

                <input
                    type="email"
                    name="email"
                    placeholder="Correo"
                    value={form.email}
                    onChange={handleChange}
                />
                {errors.email && <p className="error">{errors.email[0]}</p>}

                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                />
                {errors.password && <p className="error">{errors.password[0]}</p>}

                <input
                    type="password"
                    name="password_confirmation"
                    placeholder="Confirmar contraseña"
                    value={form.password_confirmation}
                    onChange={handleChange}
                />

                <button type="submit">Registrarse</button>

                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
}

export default RegisterForm;

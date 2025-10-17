import { useState } from 'react';
import '../styles/LoginForm.css';
import api from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import jwtDecode from "jwt-decode";

function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleShowPassword = () => setShowPassword(prev => !prev);

  const normalizeUser = (user) => ({
    ...user,
    id: user.id || user.usuarioID,         // siempre habrá id
    nombre: user.nombre || user.name,      // normaliza nombre
    apellidos: user.apellidos || user.surnames // normaliza apellidos
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      const { user, token } = response.data;

      const normalizedUser = normalizeUser(user);

      localStorage.setItem('usuario', JSON.stringify(normalizedUser));
      localStorage.setItem('token', token);
      onLoginSuccess(normalizedUser);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Correo o contraseña incorrectos");
      } else {
        setError("Ocurrió un error, intenta nuevamente");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse?.credential;
      if (!token) return;

      const response = await api.post('/google-login', { token });
      const { user, token: appToken } = response.data;

      const normalizedUser = normalizeUser(user);

      localStorage.setItem('usuario', JSON.stringify(normalizedUser));
      localStorage.setItem('token', appToken);
      onLoginSuccess(normalizedUser);
    } catch (err) {
      console.error("Error con login Google:", err);
      setError("Error al iniciar sesión con Google");
    }
  };






  return (
    <div className="login-wrapper">
      <div className="login-container">
        <header className="login-header">
          <h1>Sistema de Solicitud de Vacaciones</h1>
          <img
            //src={`${import.meta.env.VITE_IMAGE_URL}/soko.png`}
            src="http://localhost:8000/images/soko.png"
            alt="SokoLabs"
            className="login-header-image"
          />
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <h2>Iniciar Sesión</h2>

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}  // deshabilita campo mientras carga
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}  // deshabilita campo mientras carga
            />
            <span
              className="password-toggle"
              onClick={toggleShowPassword}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleShowPassword(); }}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  width="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#656565ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7a10.94 10.94 0 0 1 1.66-2.89" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" />
                  <path d="M14.12 14.12a6 6 0 0 1-8.48-8.48" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  width="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#656565ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              // Aquí un spinner simple SVG inline o texto "Cargando..."
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
              'Iniciar sesión'
            )}
          </button>

          {error && <p className="error">{error}</p>}
        </form>
        <br></br>
        {/* 🔹 Botón de Google */}
        <div className="google-login">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log("Error en login con Google")}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginForm;

import { FaUser, FaCog, FaQuestionCircle, FaSignOutAlt, FaEdit, FaCamera, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

import { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import EmpleadoDashboard from './pages/EmpleadoDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalActivo, setModalActivo] = useState(''); // '' | 'perfil' | 'config' | 'ayuda'
  const menuRef = useRef(null);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const toggleMostrarPassword = () => setMostrarPassword(prev => !prev);

  const handleGuardarPassword = async () => {
    setPasswordError('');

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setPasswordError('Por favor completa todos los campos.');
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setLoadingPassword(true);
    try {
      // Asumo que cambiarPassword es async y hace la petición al backend.
      // Si tu cambiarPassword muestra alert en vez de devolver Promise, puedes adaptar aquí.
      await cambiarPassword(passwordActual, passwordNueva);

      // Si la petición fue correcta, limpia campos y cierra modal
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      setModalActivo(''); // cierra el modal
    } catch (err) {
      // Manejo genérico de errores: adapta según tu propio retorno de cambiarPassword
      const msg = (err && err.message) ? err.message : 'Error al cambiar la contraseña';
      setPasswordError(msg);
    } finally {
      setLoadingPassword(false);
    }
  };


  useEffect(() => {
    setMenuAbierto(false);
  }, [usuario]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const manejarLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  if (!usuario) {
    return (
      <div className="auth-wrapper">
        {mostrarRegistro ? (
          <RegisterForm onRegisterSuccess={setUsuario} />
        ) : (
          <LoginForm onLoginSuccess={setUsuario} />
        )}

        <p className="texto-centrado">
          {mostrarRegistro ? (
            <>¿Ya tienes una cuenta? <button onClick={() => setMostrarRegistro(false)}>Inicia sesión</button></>
          ) : (
            <>¿No tienes cuenta? <button onClick={() => setMostrarRegistro(true)}>Regístrate</button></>
          )}
        </p>
      </div>
    );
  }

  const cambiarAvatar = (event) => {
    const file = event.target.files[0]; // Tomamos el primer archivo seleccionado
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const usuarioActualizado = { ...usuario, avatarUrl: reader.result };
        setUsuario(usuarioActualizado);
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      };
      reader.readAsDataURL(file); // Convierte la imagen a base64
    }
  };

  const cambiarPassword = async (actual, nueva) => {
    if (!actual || !nueva) {
      alert('Por favor ingresa ambas contraseñas');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/usuarios/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Si usas token JWT:
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuarioID: usuario.usuarioID, // ID del usuario
          passwordActual: actual,
          passwordNueva: nueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Contraseña actualizada correctamente');
        setPasswordActual('');
        setPasswordNueva('');
      } else {
        alert(data.message || 'Error al actualizar la contraseña');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
    }
  };


  return (
    <>
      <header className="encabezado-app">
        <div className="contenedor-logo">
          <img src="http://localhost:8000/images/soko.png" alt="Logo" className="logo" />
        </div>

        <div className="info-usuario" ref={menuRef}>
          <span className="nombre-usuario">{usuario.nombre || usuario.name || 'Usuario'}</span>
          <img
            src={usuario.avatarUrl || 'http://localhost:8000/images/user.jpg'}
            alt="Foto de perfil"
            className="foto-perfil"
          />
          <div className="menu-usuario">
            <button
              className="boton-menu"
              onClick={() => setMenuAbierto((prev) => !prev)}
              style={{ outline: 'none' }}
            >
              &#9776;
            </button>
            {menuAbierto && (
              <ul className="menu-desplegable">
                <li onClick={() => setModalActivo('perfil')}>
                  <FaUser style={{ marginRight: '8px' }} /> Perfil
                </li>
                <li onClick={() => setModalActivo('password')}>
                  <FaLock style={{ marginRight: '8px' }} /> Contraseña
                </li>
                <li onClick={() => setModalActivo('ayuda')}>
                  <FaQuestionCircle style={{ marginRight: '8px' }} /> Ayuda
                </li>
                <li onClick={manejarLogout}>
                  <FaSignOutAlt style={{ marginRight: '8px' }} /> Cerrar sesión
                </li>
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* MODALES */}
      {modalActivo && (
        <div className="modal-fondo" onClick={() => setModalActivo('')}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <button className="cerrar-modal" onClick={() => setModalActivo('')}>X</button>
            {modalActivo === 'perfil' && (
              <div className="perfil-modal">
                <h2>Perfil</h2>
                <div className="foto-contenedor">
                  <img
                    src={usuario.avatarUrl || 'http://localhost:8000/images/user.jpg'}
                    alt="Foto de perfil"
                    className="perfil-foto"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={cambiarAvatar}
                    id="avatar-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="avatar-input" className="boton-camara">
                    <FaCamera />
                  </label>
                </div>


                {usuario.rol_id === 1 && <p>Cuenta de empleado</p>}
                {usuario.rol_id === 2 && <p>Cuenta de supervisor</p>}
                {usuario.rol_id === 3 && <p>Cuenta de administrador</p>}

                {/* Nombre */}
                <p>
                  <b>Nombre:</b> {usuario.nombre}{' '}
                  <button className="boton-editar" onClick={() => editarCampo('nombre')}>
                    <FaEdit />
                  </button>
                </p>

                {/* Apellidos */}
                <p>
                  <b>Apellidos:</b> {usuario.apellidos}{' '}
                  <button className="boton-editar" onClick={() => editarCampo('apellidos')}>
                    <FaEdit />
                  </button>
                </p>
                <p><b>Email:</b> {usuario.email || 'No registrado'}</p>
              </div>

            )}

            {modalActivo === 'password' && (
              <div className="modal-password">
                <h2>Cambiar Contraseña</h2>

                {/* Contraseña actual */}
                <div className="password-change">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Contraseña actual"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    disabled={loadingPassword}
                  />
                  <span
                    className="password-togg"
                    onClick={toggleMostrarPassword}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleMostrarPassword(); }}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {/* Nueva contraseña */}
                <div className="password-change">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    disabled={loadingPassword}
                  />
                  <span
                    className="password-togg"
                    onClick={toggleMostrarPassword}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleMostrarPassword(); }}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {/* Confirmar nueva contraseña */}
                <div className="password-change">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Confirmar nueva contraseña"
                    value={passwordConfirmar}
                    onChange={(e) => setPasswordConfirmar(e.target.value)}
                    disabled={loadingPassword}
                  />
                  <span
                    className="password-togg"
                    onClick={toggleMostrarPassword}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleMostrarPassword(); }}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <button
                  className="boton-guardar-password"
                  onClick={handleGuardarPassword}
                  disabled={loadingPassword}
                >
                  {loadingPassword ? (
                    /* spinner inline pequeño */
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                      <circle cx="50" cy="50" fill="none" stroke="#fff" strokeWidth="10" r="35" strokeDasharray="164.93361431346415 56.97787143782138">
                        <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1" />
                      </circle>
                    </svg>
                  ) : (
                    'Guardar'
                  )}
                </button>

                {passwordError && <p className="error">{passwordError}</p>}
              </div>
            )}


            {modalActivo === 'ayuda' && (
              <div>
                <h2>Ayuda</h2>
                <p>Si tienes problemas, contacta soporte@company.com</p>
                <p>Puedes consultar la documentación en línea para más información.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="contenedor-dashboard">
        {usuario.rol_id === 1 && (
          <EmpleadoDashboard
            userID={usuario.usuarioID}
            userName={usuario.nombre}
            userSurname={usuario.apellidos}
          />
        )}
        {usuario.rol_id === 2 && (
          <SupervisorDashboard
            userID={usuario.usuarioID}
            userName={usuario.nombre}
            userSurname={usuario.apellidos}
          />
        )}
        {usuario.rol_id === 3 && (
          <AdminDashboard
            userID={usuario.usuarioID}
            userName={usuario.nombre}
            userSurname={usuario.apellidos}
          />
        )}
        {!([1, 2, 3].includes(usuario.rol_id)) && <label>No tienes acceso al sistema.</label>}
      </div>

      <footer className="pie-app">
        <p>© {new Date().getFullYear()} Soko Labs. Todos los derechos reservados</p>
      </footer>
    </>
  );
}

export default App;

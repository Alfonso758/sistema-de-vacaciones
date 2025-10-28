import {FaUser, FaQuestionCircle, FaSignOutAlt, FaEdit, FaCamera, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

import { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import SinAcceso from './components/SinAcceso';
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
  const [modalActivo, setModalActivo] = useState('');
  const menuRef = useRef(null);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [campoEditable, setCampoEditable] = useState('');
  const [valorEditable, setValorEditable] = useState('');
  const [jefe, setJefe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuColapsado, setMenuColapsado] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  const imagesBaseUrl = import.meta.env.VITE_IMAGE_URL;

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

  useEffect(() => {
    if (modalActivo === 'perfil' && usuario.rol_id === 1 && usuario.jefe_directo) {
      const token = localStorage.getItem('token');
      console.log('🔍 Obteniendo datos del jefe directo con ID:', usuario.jefe_directo);

      fetch(`${apiBaseUrl}/api/usuarios/${usuario.jefe_directo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log('📦 Respuesta del backend del jefe:', data);
          // Ajusta esto según cómo venga la estructura del backend
          setJefe(data.usuario || data);
        })
        .catch(err => console.error('❌ Error al obtener jefe directo:', err));
    }
  }, [modalActivo, usuario]);



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

  const cambiarAvatar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token'); // token de login
      const response = await fetch(`${apiBaseUrl}/api/usuarios/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Actualiza la URL del avatar en React y en localStorage
        setUsuario(prev => {
          const actualizado = { ...prev, avatarUrl: data.avatarUrl };
          localStorage.setItem('usuario', JSON.stringify(actualizado));
          return actualizado;
        });
        alert('Avatar actualizado correctamente');
      } else {
        alert(data.message || 'Error al subir avatar');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
    }
  };



  const cambiarPassword = async (actual, nueva) => {
    if (!actual || !nueva) {
      alert('Por favor ingresa ambas contraseñas');
      return;
    }

    try {
      const token = localStorage.getItem('token'); // O donde guardes el token después del login

      const response = await fetch(`${apiBaseUrl}/api/usuarios/cambiar-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ token requerido
        },
        body: JSON.stringify({
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

  const iniciarEdicion = (campo, valor) => {
    setCampoEditable(campo);
    setValorEditable(valor);
  };


  const editarCampo = async (campo, valor) => {
    if (!valor) valor = campo === 'nombre' ? usuario.nombre : usuario.apellidos;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiBaseUrl}/api/usuario/actualizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: campo === 'nombre' ? valor : usuario.nombre,
          apellidos: campo === 'apellidos' ? valor : usuario.apellidos
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUsuario(prev => {
          const actualizado = { ...prev, ...data.usuario };
          localStorage.setItem('usuario', JSON.stringify(actualizado));
          return actualizado;
        });
        setCampoEditable('');
        setValorEditable('');
      } else {
        alert(data.message || 'Error al actualizar');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <header className="encabezado-app">
        <div className="contenedor-logo">
          <div className="logo-header">
            <img src={`${imagesBaseUrl}/soko.png`} alt="Logo" className="logo" />
          </div>

          <button
            className="boton-colapsar"
            onClick={() => setMenuColapsado(!menuColapsado)}
            aria-label="Colapsar menú"
          >
            &#9776;
          </button>

        </div>

        <div className="info-usuario" ref={menuRef}>
          <span className="nombre-usuario">{usuario.nombre || usuario.name || 'Usuario'}</span>
          <img
            src={
              usuario.avatarUrl
                ? usuario.avatarUrl.startsWith("storage/")
                  ? usuario.avatarUrl.replace(/^storage\//, "")
                  : usuario.avatarUrl
                : `${imagesBaseUrl}/user.jpg`
            }
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
              <div className="modal-fondo" onClick={() => setModalActivo('')}>
                <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                  <button className="cerrar-modal" onClick={() => setModalActivo('')}>X</button>

                  <div className="perfil-modal">
                    <h2>Perfil</h2>

                    <div className="foto-contenedor">
                      <img
                        src={
                          usuario.avatarUrl
                            ? usuario.avatarUrl.startsWith("storage/")
                              ? usuario.avatarUrl.replace(/^storage\//, "")
                              : usuario.avatarUrl
                            : `${imagesBaseUrl}/user.jpg`
                        }
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

                    <div className="campo-perfil">
                      <label><b>Nombre(s):</b></label>
                      {campoEditable === 'nombre' ? (
                        <div className="campo-editable">
                          <input
                            type="text"
                            value={valorEditable}
                            onChange={(e) => setValorEditable(e.target.value)}
                            disabled={loading}
                          />
                          <button className="guardar" onClick={() => editarCampo('nombre', valorEditable)} disabled={loading}>
                            {loading ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ margin: 'auto', display: 'block', background: 'none' }}
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
                            ) : 'Guardar'}
                          </button>
                          <button className="cancelar" onClick={() => setCampoEditable('')}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="valor-display">
                          <span>{usuario.nombre || <i></i>}</span>
                          <button className="boton-editar" onClick={() => iniciarEdicion('nombre', usuario.nombre)}>
                            <FaEdit />
                          </button>
                        </div>

                      )}
                    </div>

                    <div className="campo-perfil">
                      <label><b>Apellido(s):</b></label>
                      {campoEditable === 'apellidos' ? (
                        <div className="campo-editable">
                          <input
                            type="text"
                            value={valorEditable}
                            onChange={(e) => setValorEditable(e.target.value)}
                            disabled={loading}
                          />
                          <button className="guardar" onClick={() => editarCampo('apellidos', valorEditable)} disabled={loading}>
                            {loading ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ margin: 'auto', display: 'block', background: 'none' }}
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
                            ) : 'Guardar'}
                          </button>
                          <button className="cancelar" onClick={() => setCampoEditable('')}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="valor-display">
                          <span>{usuario.apellidos || <i></i>}</span>
                          <button className="boton-editar" onClick={() => iniciarEdicion('apellidos', usuario.apellidos)}>
                            <FaEdit />
                          </button>
                        </div>

                      )}
                    </div>

                    <div className="campo-perfil">
                      <label><b>Email:</b></label>
                      <div className="valor-display">{usuario.email || 'No registrado'}</div>
                    </div>

                    {usuario.rol_id === 1 && (
                      <div className="campo-perfil">
                        <label><b>Jefe directo:</b></label>
                        <div className="valor-display">
                          {jefe
                            ? `${jefe.name} ${jefe.surnames}`
                            : usuario.jefe_directo
                              ? 'Cargando...'
                              : 'No asignado'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
        {usuario.activo === false ? (
          <SinAcceso usuario={usuario} />
        ) : (
          <>
            {usuario.rol_id === 1 && usuario.activo === true && (
              <EmpleadoDashboard
                userID={usuario.usuarioID}
                userName={usuario.nombre}
                userSurname={usuario.apellidos}
                menuColapsado={menuColapsado}
              />
            )}
            {usuario.rol_id === 2 && usuario.activo === true && (
              <SupervisorDashboard
                userID={usuario.usuarioID}
                userName={usuario.nombre}
                userSurname={usuario.apellidos}
                menuColapsado={menuColapsado}
              />
            )}
            {usuario.rol_id === 3 && usuario.activo === true && (
              <AdminDashboard
                userID={usuario.usuarioID}
                userName={usuario.nombre}
                userSurname={usuario.apellidos}
                menuColapsado={menuColapsado}
              />
            )}
          </>
        )}
      </div>


      <footer className="pie-app">
        <p>© {new Date().getFullYear()} Soko Labs. Todos los derechos reservados</p>
      </footer>
    </>
  );
}

export default App;
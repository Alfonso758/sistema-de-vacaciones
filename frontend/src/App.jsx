import { FaUser, FaCog, FaQuestionCircle, FaSignOutAlt } from 'react-icons/fa';
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
  const menuRef = useRef(null); // ref para detectar clicks afuera

  // Cierra el menú al cambiar de usuario
  useEffect(() => {
    setMenuAbierto(false);
  }, [usuario]);

  // Cierra el menú si se hace click fuera
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
              style={{ outline: 'none' }} // quita la línea negra al hacer click
            >
              &#9776;
            </button>
            {menuAbierto && (
              <ul className="menu-desplegable">
                <li onClick={() => alert('Ir a perfil')}>
                  <FaUser style={{ marginRight: '8px' }} /> Perfil
                </li>
                <li onClick={() => alert('Configuración')}>
                  <FaCog style={{ marginRight: '8px' }} /> Configuración
                </li>
                <li onClick={() => alert('Ayuda')}>
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

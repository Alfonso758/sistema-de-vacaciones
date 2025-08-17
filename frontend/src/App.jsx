import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import EmpleadoDashboard from './pages/EmpleadoDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [showRegister, setShowRegister] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Cierra el menú al cambiar de usuario
  useEffect(() => {
    setMenuOpen(false);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return showRegister ? (
      <>
        <RegisterForm onRegisterSuccess={setUser} />
        <p className="center-text">
          ¿Ya tienes una cuenta?{' '}
          <button onClick={() => setShowRegister(false)}>Inicia sesión</button>
        </p>
      </>
    ) : (
      <>
        <LoginForm onLoginSuccess={setUser} />
        <p className="center-text">
          ¿No tienes cuenta?{' '}
          <button onClick={() => setShowRegister(true)}>Regístrate</button>
        </p>
      </>
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="logo-container">
          <img src="http://localhost:8000/images/soko.png" alt="Logo" className="logo" />
        </div>

        <div className="user-info">
          <span className="user-name">{user.nombre || user.name || 'Usuario'}</span>
          <img
            src={user.avatarUrl || 'http://localhost:8000/images/user.jpg'}
            alt="Foto de perfil"
            className="profile-pic"
          />
          <div className="user-menu">
            <button className="menu-toggle" onClick={() => setMenuOpen((prev) => !prev)}>
              &#9776;
            </button>
            {menuOpen && (
              <ul className="menu-dropdown">
                <li onClick={() => alert('Ir a perfil')}>Perfil</li>
                <li onClick={() => alert('Configuración')}>Configuración</li>
                <li onClick={() => alert('Ayuda')}>Ayuda</li>
                <li onClick={handleLogout}>Cerrar sesión</li>
              </ul>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {user.rol_id === 1 && <EmpleadoDashboard userID={user.usuarioID} userName={user.nombre} userSurname={user.apellidos} />}
        {user.rol_id === 2 && <SupervisorDashboard userName={user.nombre} userSurname={user.apellidos} />}
        {user.rol_id === 3 && <AdminDashboard userName={user.nombre} userSurname={user.apellidos} />}
        {!([1, 2, 3].includes(user.rol_id)) && <label>No tienes acceso al sistema.</label>}
      </div>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} sokolabs. Todos los derechos reservados</p>
      </footer>
    </>
  );
}

export default App;

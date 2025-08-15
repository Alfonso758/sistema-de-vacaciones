import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import EmpleadoDashboard from './pages/EmpleadoDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  // Estado del usuario
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [showRegister, setShowRegister] = useState(false);
  const [selectedNav, setSelectedNav] = useState('');

  // Cambia pestaña inicial al iniciar sesión
  useEffect(() => {
    if (!user) return;

    // Inicializa la pestaña según el rol
    if (user.rol_id === 1 || user.rol_id === 2) setSelectedNav('Nueva solicitud');
    if (user.rol_id === 3) setSelectedNav('Solicitudes');

    // Para prueba: fuerza rol_id = 0
    // Esto simula un usuario sin acceso
    //setUser((prev) => ({ ...prev, rol_id: 0 }));
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setSelectedNav('');
  };

  // Mostrar login o registro si no hay usuario
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

  // Tabs según rol
  const rolTabs = {
    1: ['Nueva solicitud', 'Solicitudes', 'Calendario', 'Notificaciones'],
    2: ['Nueva solicitud', 'Solicitudes', 'Calendario', 'Reportes', 'Notificaciones'],
    3: ['Solicitudes', 'Calendario', 'Reportes', 'Notificaciones'],
  };

  return (
    <>
      {/* HEADER */}
      <header className="app-header">
        <div className="logo-container">
          <img src="http://localhost:8000/images/soko.png" alt="Logo" className="logo" />
        </div>

        <nav className="nav-bar">
          {rolTabs[user.rol_id]?.map((btn) => (
            <button
              key={btn}
              onClick={() => setSelectedNav(btn)}
              className={`nav-button ${selectedNav === btn ? 'active' : ''}`}
            >
              {btn}
            </button>
          ))}
        </nav>

        <div className="user-info">
          <span className="user-name">
            {user.nombre || user.name || 'Usuario'}
          </span>
          <img
            src={user.avatarUrl || 'http://localhost:8000/images/user.jpg'}
            alt="Foto de perfil"
            className="profile-pic"
          />
          <button onClick={handleLogout} className="logout-button">
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* DASHBOARD */}
      <div className="dashboard-container">
        {user.rol_id === 1 && (
          <EmpleadoDashboard
            userName={user.nombre}
            userSurname={user.apellidos}
            activeTab={selectedNav}
          />
        )}
        {user.rol_id === 2 && <SupervisorDashboard activeTab={selectedNav} />}
        {user.rol_id === 3 && <AdminDashboard activeTab={selectedNav} />}
        {!([1, 2, 3].includes(user.rol_id)) && <label>No tienes acceso al sistema.</label>}
      </div>
    </>
  );
}

export default App;

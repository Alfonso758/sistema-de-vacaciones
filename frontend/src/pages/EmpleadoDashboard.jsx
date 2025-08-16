import { useState, useEffect } from 'react';
import '../styles/EmpleadoDashboard.css';
import { FaPlusCircle, FaListAlt, FaCalendarAlt, FaBell, FaBars } from 'react-icons/fa';

export default function EmpleadoDashboard({ userName, userSurname, activeTab }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(activeTab || 'Nueva solicitud');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.add("empleado-page");
    return () => document.body.classList.remove("empleado-page");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fechaInicio || !fechaFin) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (fechaFin < fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    setSuccess('Solicitud de vacaciones enviada correctamente.');
    setFechaInicio('');
    setFechaFin('');
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'Nueva solicitud':
        return (
          <>
            <div className="summary-section">

              {/* Tarjeta de bienvenida */}
              <div className="summary-card days-card">
                <h4>Empleado</h4>
                <p><strong>{userName} {userSurname}</strong></p>
                <p>Puesto: Analista de Software</p>
                <p>Área: Desarrollo</p>
              </div>

              {/* Tarjeta de vacaciones */}
              <div className="summary-card upcoming-card">
                <h4>Vacaciones</h4>
                <p><strong>Días disponibles:</strong> 15</p>
                <p><strong>Última solicitud:</strong> 05 Julio 2025</p>
                <p><strong>Próxima renovación:</strong> 16 Agosto 2025</p>
              </div>

              {/* Tarjeta de antigüedad y estado */}
              <div className="summary-card status-card">
                <h4>Perfil laboral</h4>
                <p><strong>Tiempo en la empresa:</strong> 6 años</p>
                <p><strong>Estado:</strong> Activo</p>
                <p><strong>Jefe directo:</strong> Laura Martínez</p>
              </div>

            </div>


            <div className="form-section">
              <div className="form-card form-card-wide">
                <h3>Nueva solicitud</h3>
                <form onSubmit={handleSubmit}>
                  <div className="input-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label>Fecha de Fin</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>

                  <button type="submit">Enviar Solicitud</button>
                  {error && <p className="error">{error}</p>}
                  {success && <p className="success">{success}</p>}
                </form>
              </div>
            </div>
          </>
        );

      case 'Solicitudes':
        return (
          <div className="list-section">
            <div className="list-card">
              <h3>Solicitudes Enviadas</h3>
              <p>Aquí se mostrarían las solicitudes del empleado con estados y fechas.</p>
            </div>
          </div>
        );

      case 'Calendario':
        return (
          <div className="calendar-section">
            <div className="calendar-card">
              <h3>Calendario de Vacaciones</h3>
              <p>Aquí se mostraría un calendario interactivo.</p>
            </div>
          </div>
        );

      case 'Notificaciones':
        return (
          <div className="notification-section">
            <div className="notification-card">
              <h3>Notificaciones</h3>
              <p>Aquí se mostrarían las notificaciones del empleado.</p>
            </div>
          </div>
        );

      default:
        return <p>Pestaña no encontrada.</p>;
    }
  };

  return (
    <div className="dashboard-container full-screen">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{!isCollapsed && 'Panel'}</h2>
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <FaBars />
          </button>
        </div>
        <nav>
          <ul>
            {[
              { name: 'Nueva solicitud', icon: <FaPlusCircle /> },
              { name: 'Solicitudes', icon: <FaListAlt /> },
              { name: 'Calendario', icon: <FaCalendarAlt /> },
              { name: 'Notificaciones', icon: <FaBell /> }
            ].map(({ name, icon }) => (
              <li
                key={name}
                className={selectedTab === name ? 'active' : ''}
                onClick={() => setSelectedTab(name)}
              >
                <span className="icon">{icon}</span>
                {!isCollapsed && <span className="text">{name}</span>}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

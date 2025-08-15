import { useState, useEffect } from 'react';
import '../styles/EmpleadoDashboard.css';

export default function EmpleadoDashboard({ userName, userSurname, activeTab }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(activeTab || 'Nueva solicitud');

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
              <div className="summary-card days-card">
                <h4>Bienvenido</h4>
                <p>{userName} {userSurname}</p>
              </div>
              <div className="summary-card upcoming-card">
                <h4>Días Disponibles</h4>
                <p>15</p>
              </div>
              <div className="summary-card status-card">
                <h4>Próximas Vacaciones</h4>
                <p>12 - 16 Ago 2025</p>
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
                <br></br><br></br><br></br><br></br><br></br>
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
      <aside className="sidebar">
        <h2>Panel</h2>
        <nav>
          <ul>
            {['Nueva solicitud', 'Solicitudes', 'Calendario', 'Notificaciones'].map(tab => (
              <li
                key={tab}
                className={selectedTab === tab ? 'active' : ''}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
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

import { useState, useEffect } from 'react';
import '../styles/EmpleadoDashboard.css';

export default function EmpleadoDashboard({ userName, userSurname, activeTab }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setMotivo('');
  };

  // Función para renderizar contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'Nueva solicitud':
        return (
          <div id="empleado-form-container">
            <h2>Información del empleado</h2>
            <label>Nombre: {userName + " " + userSurname}</label>
            <label>Días disponibles:</label>

            <h2>Nueva solicitud</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Fecha de Inicio:
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </label>

              <label>
                Fecha de Fin:
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                />
              </label>

              <button type="submit">
                Enviar Solicitud
              </button>

              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}
            </form>
          </div>
        );

      case 'Solicitudes':
        return (
          <div>
            <h2>Lista de solicitudes</h2>
            <p>Aquí se mostrarían las solicitudes enviadas por el empleado.</p>
          </div>
        );

      case 'Calendario':
        return (
          <div>
            <h2>Calendario de vacaciones</h2>
            <p>Aquí se mostraría un calendario con los días de vacaciones.</p>
          </div>
        );

      case 'Notificaciones':
        return (
          <div>
            <h2>Notificaciones</h2>
            <p>Aquí se mostrarían las notificaciones para el empleado.</p>
          </div>
        );

      default:
        return <p>Pestaña no encontrada.</p>;
    }
  };

  return (
    <div id="empleado-dashboard">
      {renderContent()}
    </div>
  );
}

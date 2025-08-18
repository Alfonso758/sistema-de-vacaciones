import { useState, useEffect } from 'react';
import '../styles/EmpleadoDashboard.css';
import { FaPlusCircle, FaListAlt, FaCalendarAlt, FaBell, FaBars } from 'react-icons/fa';

export default function EmpleadoDashboard({ userID, userName, userSurname, pestañaActiva }) {
  const [fechaInicioVacaciones, setFechaInicioVacaciones] = useState('');
  const [fechaFinVacaciones, setFechaFinVacaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState(pestañaActiva || 'Nueva solicitud');
  const [menuColapsado, setMenuColapsado] = useState(false);

  useEffect(() => {
    document.body.classList.add("pagina-empleado");
    return () => document.body.classList.remove("pagina-empleado");
  }, []);

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!fechaInicioVacaciones || !fechaFinVacaciones) {
      setMensajeError('Por favor completa todos los campos.');
      return;
    }

    if (fechaFinVacaciones < fechaInicioVacaciones) {
      setMensajeError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:8000/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          usuario_id: userID,
          fecha_inicio: fechaInicioVacaciones,
          fecha_fin: fechaFinVacaciones
        })
      });

      if (!respuesta.ok) throw new Error('Error al registrar la solicitud');

      setMensajeExito('Solicitud de vacaciones enviada correctamente.');
      setFechaInicioVacaciones('');
      setFechaFinVacaciones('');
    } catch (err) {
      setMensajeError(err.message);
    }
  };

  const mostrarContenido = () => {
    switch (pestañaSeleccionada) {
      case 'Nueva solicitud':
        return (
          <>
          <h2 className='titulo1'>Nueva solicitud</h2>
            <div className="labels-linea">
              <label >15</label>
              <label className="disponibles">Días de vacaciones disponibles hasta el</label>
              <label>16 de agosto 2025</label>
            </div>
            <div className="seccion-formulario">
              <div className="tarjeta-formulario tarjeta-formulario-grande">
                <br></br>
                <form onSubmit={enviarSolicitud}>
                  <div className="grupo-input">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      value={fechaInicioVacaciones}
                      onChange={(e) => setFechaInicioVacaciones(e.target.value)}
                    />
                  </div>

                  <div className="grupo-input">
                    <label>Fecha de Fin</label>
                    <input
                      type="date"
                      value={fechaFinVacaciones}
                      onChange={(e) => setFechaFinVacaciones(e.target.value)}
                    />
                  </div>

                  <button type="submit">Enviar Solicitud</button>
                  {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
                  {mensajeExito && <p className="mensaje-exito">{mensajeExito}</p>}
                </form>
              </div>
            </div>
          </>
        );

      case 'Solicitudes':
        return (
          <div className="seccion-lista">
            <div className="tarjeta-lista">
              <h3>Solicitudes Enviadas</h3>
              <p>Aquí se mostrarían las solicitudes del empleado con estados y fechas.</p>
            </div>
          </div>
        );

      case 'Calendario':
        return (
          <div className="seccion-calendario">
            <div className="tarjeta-calendario">
              <h3>Calendario de Vacaciones</h3>
              <p>Aquí se mostraría un calendario interactivo.</p>
            </div>
          </div>
        );

      case 'Notificaciones':
        return (
          <div className="seccion-notificaciones">
            <div className="tarjeta-notificaciones">
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
    <div className="contenedor-dashboard pantalla-completa">
      <aside className={`barra-lateral ${menuColapsado ? 'colapsada' : ''}`}>
        <div className="encabezado-barra">
          <h3>{!menuColapsado && 'Panel'}</h3>
          <button
            className="boton-colapsar"
            onClick={() => setMenuColapsado(!menuColapsado)}
          >
            <FaBars />
          </button>
        </div>
        <nav>
          <ul>
            {[
              { nombre: 'Nueva solicitud', icono: <FaPlusCircle /> },
              { nombre: 'Solicitudes', icono: <FaListAlt /> },
              { nombre: 'Calendario', icono: <FaCalendarAlt /> },
              { nombre: 'Notificaciones', icono: <FaBell /> }
            ].map(({ nombre, icono }) => (
              <li
                key={nombre}
                className={pestañaSeleccionada === nombre ? 'activo' : ''}
                onClick={() => setPestañaSeleccionada(nombre)}
              >
                <span className="icono">{icono}</span>
                {!menuColapsado && <span className="texto">{nombre}</span>}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="contenido-principal">
        {mostrarContenido()}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import '../styles/EmpleadoDashboard.css';
import Solicitudes from '../components/Solicitudes';
import { FaPlusCircle, FaListAlt, FaCalendarAlt, FaBell, FaBars } from 'react-icons/fa';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export default function EmpleadoDashboard({ userID, userName, userSurname, pestañaActiva }) {
  const [fechaInicioVacaciones, setFechaInicioVacaciones] = useState('');
  const [fechaFinVacaciones, setFechaFinVacaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState(pestañaActiva || 'Nueva solicitud');
  const [menuColapsado, setMenuColapsado] = useState(false);

  // Estados para los datos de vacaciones
  const [anosTrabajados, setAnosTrabajados] = useState(0);
  const [diasTomados, setDiasTomados] = useState(0);
  const [diasDisponibles, setDiasDisponibles] = useState(0);
  const [fechaFinAnio, setFechaFinAnio] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [diasAnuales, setDiasAnuales] = useState(0);



  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/datos-vacaciones/${userID}`);
        setAnosTrabajados(res.data.anosTrabajados);
        setDiasTomados(res.data.diasTomados);
        setDiasDisponibles(res.data.diasDisponibles);
        setFechaFinAnio(res.data.fechaFinAnio);
        setFechaIngreso(res.data.fechaIngreso);
        setDiasAnuales(res.data.diasAnuales);

      } catch (err) {
        console.error('Error al cargar datos de vacaciones', err);
      }
    };
    cargarDatos();
  }, [userID]);


  // Cargar datos de vacaciones desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/datos-vacaciones/${userID}`);
        setAnosTrabajados(res.data.anosTrabajados);
        setDiasTomados(res.data.diasTomados);
        setDiasDisponibles(res.data.diasDisponibles);
        setFechaFinAnio(res.data.fechaFinAnio);
      } catch (err) {
        console.error('Error al cargar datos de vacaciones', err);
      }
    };
    cargarDatos();
  }, [userID]);

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!fechaInicioVacaciones || !fechaFinVacaciones) {
      setMensajeError('Por favor completa todos los campos.');
      return;
    }

    const hoy = dayjs();
    const inicio = dayjs(fechaInicioVacaciones, 'YYYY-MM-DD');
    const fin = dayjs(fechaFinVacaciones, 'YYYY-MM-DD');

    // Validación: fecha fin mayor que fecha inicio
    if (fin.isBefore(inicio)) {
      setMensajeError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    // Validación: solicitud al menos 2 meses antes
    if (inicio.diff(hoy, 'month') < 2) {
      setMensajeError('Las vacaciones deben solicitarse al menos con 2 meses de anticipación.');
      return;
    }

    // Calcular días hábiles entre inicio y fin
    let diasSolicitados = 0;
    let diaActual = inicio.clone();
    while (diaActual.isBefore(fin.add(1, 'day'))) { // incluir fecha fin
      const diaSemana = diaActual.day(); // 0 = domingo, 6 = sábado
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasSolicitados++;
      }
      diaActual = diaActual.add(1, 'day');
    }

    // Validación: no exceder días disponibles
    if (diasSolicitados > diasDisponibles) {
      setMensajeError(`No puedes solicitar ${diasSolicitados} días. Solo tienes ${diasDisponibles} disponibles.`);
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
              <label>{anosTrabajados}</label>
              <label className="disponibles">Años laborando desde</label>
              <label>{fechaIngreso}</label> {/* ahora muestra la fecha real de ingreso */}
            </div>

            <div className="labels-linea">
              <label>{diasTomados}/{diasAnuales}</label>
              <label className="disponibles">Días tomados este año.</label>
            </div>

            <div className="labels-linea">
              <label>{diasDisponibles}</label>
              <label className="disponibles">Días disponibles hasta el</label>
              <label>{fechaFinAnio}</label>
            </div>


            <div className="seccion-formulario">
              <div className="tarjeta-formulario tarjeta-formulario-grande">
                <br />
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
        return <Solicitudes userID={userID} />;

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

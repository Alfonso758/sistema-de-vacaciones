import { useState, useEffect, useCallback } from 'react';
import '../styles/EmpleadoDashboard.css';
import Solicitudes from '../components/Solicitudes';
import Calendario from '../components/Calendario';
import Notificaciones from '../components/Notificaciones';
import NuevaSolicitud from '../components/NuevaSolicitud';
import { FaPlusCircle, FaListAlt, FaCalendarAlt, FaBell, FaBars } from 'react-icons/fa';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export default function EmpleadoDashboard({ userID, userName, userSurname, pestañaActiva }) {
  // Form / UI
  const [fechaInicioVacaciones, setFechaInicioVacaciones] = useState('');
  const [fechaFinVacaciones, setFechaFinVacaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [menuColapsado, setMenuColapsado] = useState(false);

  // Datos de vacaciones
  const [anosTrabajados, setAnosTrabajados] = useState(0);
  const [diasTomados, setDiasTomados] = useState(0);
  const [diasDisponibles, setDiasDisponibles] = useState(0);
  const [fechaFinAnio, setFechaFinAnio] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [diasAnuales, setDiasAnuales] = useState(0);

  // Menú tipo acordeón con iconos en títulos y opciones
  const menu = {
    "Solicitudes": {
      icono: <FaListAlt />, // Icono del título
      opciones: [
        { nombre: "Nueva solicitud" },
        { nombre: "Mis solicitudes" }
      ]
    },
    "Calendario": {
      icono: <FaCalendarAlt />,
      opciones: [
        { nombre: "Ver calendario" }
      ]
    },
    "Notificaciones": {
      icono: <FaBell />,
      opciones: [
        { nombre: "Ver notificaciones" }
      ]
    }
  };


  // Estado del menú abierto y pestaña seleccionada
  const [desgloceAbierto, setDesgloceAbierto] = useState("Solicitudes");
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState(menu["Solicitudes"].opciones[0].nombre);

  const toggleDesgloce = (titulo) => {
    if (desgloceAbierto === titulo) return; // si ya está abierto, no hace nada
    setDesgloceAbierto(titulo); // abrir la nueva sección
    setPestañaSeleccionada(menu[titulo].opciones[0].nombre); // seleccionar la primera opción por defecto
  };


  // Key para forzar remonte cuando cambie la pestaña
  const [reloadKey, setReloadKey] = useState(0);

  // Si el prop pestañaActiva cambia externamente, actualizar el estado
  useEffect(() => {
    if (pestañaActiva) setPestañaSeleccionada(pestañaActiva);
  }, [pestañaActiva]);

  // Incrementa reloadKey cada vez que cambia la pestaña (forzar remonte)
  useEffect(() => {
    setReloadKey(k => k + 1);
    setMensajeError('');
    setMensajeExito('');
  }, [pestañaSeleccionada]);

  // Función para cargar datos de vacaciones desde API
  const fetchDatosVacaciones = useCallback(async () => {
    if (!userID) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/datos-vacaciones/${userID}`);
      setAnosTrabajados(res.data.anosTrabajados ?? 0);
      setDiasTomados(res.data.diasTomados ?? 0);
      setDiasDisponibles(res.data.diasDisponibles ?? 0);
      setFechaFinAnio(res.data.fechaFinAnio ?? '');
      setFechaIngreso(res.data.fechaIngreso ?? '');
      setDiasAnuales(res.data.diasAnuales ?? 0);
    } catch (err) {
      console.error('Error al cargar datos de vacaciones', err);
    }
  }, [userID]);

  // Cargar datos cuando entres a "Nueva solicitud" (o cuando cambie reloadKey)
  useEffect(() => {
    if (pestañaSeleccionada === 'Nueva solicitud') {
      setFechaInicioVacaciones('');
      setFechaFinVacaciones('');
      setMensajeError('');
      setMensajeExito('');
      fetchDatosVacaciones();
    }
  }, [pestañaSeleccionada, fetchDatosVacaciones, reloadKey]);

  // Enviar solicitud
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

    if (fin.isBefore(inicio, 'day')) {
      setMensajeError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    if (inicio.diff(hoy, 'month') < 2) {
      setMensajeError('Las vacaciones deben solicitarse al menos con 2 meses de anticipación.');
      return;
    }

    let diasSolicitados = 0;
    let diaActual = inicio.clone();
    const finInclusive = fin.clone().add(1, 'day');
    while (diaActual.isBefore(finInclusive)) {
      const diaSemana = diaActual.day();
      if (diaSemana !== 0 && diaSemana !== 6) diasSolicitados++;
      diaActual = diaActual.add(1, 'day');
    }

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

      if (!respuesta.ok) {
        const text = await respuesta.text();
        throw new Error(text || 'Error al registrar la solicitud');
      }

      setMensajeExito('Solicitud de vacaciones enviada correctamente.');
      setFechaInicioVacaciones('');
      setFechaFinVacaciones('');
      await fetchDatosVacaciones();

    } catch (err) {
      setMensajeError(err.message || 'Error al enviar solicitud.');
    }
  };

  // Contenido según pestaña
  const mostrarContenido = () => {
    switch (pestañaSeleccionada) {
      case 'Nueva solicitud':
        return (
          <NuevaSolicitud
            anosTrabajados={anosTrabajados}
            diasTomados={diasTomados}
            diasAnuales={diasAnuales}
            diasDisponibles={diasDisponibles}
            fechaIngreso={fechaIngreso}
            fechaFinAnio={fechaFinAnio}
            fechaInicioVacaciones={fechaInicioVacaciones}
            setFechaInicioVacaciones={setFechaInicioVacaciones}
            fechaFinVacaciones={fechaFinVacaciones}
            setFechaFinVacaciones={setFechaFinVacaciones}
            mensajeError={mensajeError}
            mensajeExito={mensajeExito}
            enviarSolicitud={enviarSolicitud}
          />
        );

      case 'Mis solicitudes':
        return <Solicitudes userID={userID} />;

      case 'Ver calendario':
        return <Calendario userID={userID} />;

      case 'Ver notificaciones':
        return <Notificaciones userID={userID} />;

      default:
        return <p>Pestaña no encontrada.</p>;
    }
  };

  return (
    <div className={`contenedor-dashboard pantalla-completa ${menuColapsado ? 'menu-colapsado' : ''}`}>
      <aside className={`barra-lateral ${menuColapsado ? 'colapsada' : ''}`}>
        <div className="encabezado-barra">
          <h3>{!menuColapsado && 'Panel'}</h3>
          <button
            className="boton-colapsar"
            onClick={() => setMenuColapsado(!menuColapsado)}
            aria-label="Colapsar menú"
          >
            <FaBars />
          </button>
        </div>
        <nav>
          <ul>
            {Object.keys(menu).map((titulo) => (
              <li key={titulo}>
                <div
                  className={`menu-titulo ${desgloceAbierto === titulo ? 'activo' : ''}`}
                  onClick={() => toggleDesgloce(titulo)}
                >
                  <span className="icono-titulo">{menu[titulo].icono}</span>
                  {!menuColapsado && titulo}
                </div>
                {desgloceAbierto === titulo && (
                  <ul className="sub-menu">
                    {menu[titulo].opciones.map(({ nombre, icono }) => (
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
                )}
              </li>
            ))}

          </ul>
        </nav>
      </aside>

      <main className="contenido-principal">
        <div key={`${pestañaSeleccionada}-${reloadKey}`}>
          {mostrarContenido()}
        </div>
      </main>
    </div>
  );
}

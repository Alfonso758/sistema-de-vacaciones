import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/EmpleadoDashboard.css';
import Solicitudes from '../components/Solicitudes';
import SolicitudesEquipo from '../components/SolicitudesEquipo';
import Usuarios from '../components/Usuarios';
import Calendario from '../components/Calendario';
import CalendarioEquipo from '../components/CalendarioEquipo';
import Notificaciones from '../components/Notificaciones';
import NuevaSolicitud from '../components/NuevaSolicitud';
import Reportes from '../components/Reportes';
import Estadisticas from '../components/Estadisticas';
import { FaListAlt, FaCalendarAlt, FaBell, FaBars, FaChartPie, FaCog, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export default function SupervisorDashboard({ userID, pestañaActiva }) {
  // Estados de formulario
  const [fechaInicioVacaciones, setFechaInicioVacaciones] = useState('');
  const [fechaFinVacaciones, setFechaFinVacaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [menuColapsado, setMenuColapsado] = useState(false);

  // Datos del usuario
  const [anosTrabajados, setAnosTrabajados] = useState(0);
  const [diasTomados, setDiasTomados] = useState(0);
  const [diasDisponibles, setDiasDisponibles] = useState(0);
  const [fechaFinAnio, setFechaFinAnio] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [diasAnuales, setDiasAnuales] = useState(0);
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  // Menú
  const menu = {
    "Solicitudes": {
      icono: <FaListAlt />,
      opciones: [
        { nombre: "Nueva solicitud" },
        { nombre: "Mis solicitudes" },
        { nombre: "S. Empleados" }
      ]
    },
    "Usuarios": {
      icono: <FaUsers />,
      opciones: [
        { nombre: "Lista de empleados" }
      ]
    },
    "Calendario": {
      icono: <FaCalendarAlt />,
      opciones: [
        { nombre: "Mi calendario" },
        { nombre: "C. Empleados" }
      ]
    },
    "Reportes y estadísticas": {
      icono: <FaChartPie />,
      opciones: [
        { nombre: "Reportes" },
        { nombre: "Estadísticas" }
      ]
    },
    "Notificaciones": {
      icono: <FaBell />,
      opciones: [
        { nombre: "Ver notificaciones" }
      ]
    },
    /*
    "Configuración": {
      icono: <FaCog />,
      opciones: [
        { nombre: "Gestión del área" }
      ]
    }*/
  };

  // Estados del acordeón
  const [desgloceAbierto, setDesgloceAbierto] = useState("Solicitudes");
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState("Nueva solicitud");

  // Control animación
  const ANIMATION_MS = 300;
  const switchingTimeoutRef = useRef(null);
  const endSwitchTimeoutRef = useRef(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // --- Toggle de menú ---
  const toggleDesgloce = (titulo) => {
    if (isSwitching) return;

    if (desgloceAbierto === titulo) {
      setDesgloceAbierto(null);
      return;
    }

    if (desgloceAbierto === null) {
      setDesgloceAbierto(titulo);
      return;
    }

    setIsSwitching(true);
    setDesgloceAbierto(null);

    clearTimeout(switchingTimeoutRef.current);
    switchingTimeoutRef.current = setTimeout(() => {
      setDesgloceAbierto(titulo);
      clearTimeout(endSwitchTimeoutRef.current);
      endSwitchTimeoutRef.current = setTimeout(() => {
        setIsSwitching(false);
      }, ANIMATION_MS);
    }, ANIMATION_MS);
  };

  useEffect(() => {
    return () => {
      clearTimeout(switchingTimeoutRef.current);
      clearTimeout(endSwitchTimeoutRef.current);
    };
  }, []);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (pestañaActiva) setPestañaSeleccionada(pestañaActiva);
  }, [pestañaActiva]);

  useEffect(() => {
    setReloadKey(k => k + 1);
    setMensajeError('');
    setMensajeExito('');
  }, [pestañaSeleccionada]);

  // --- Cargar datos de vacaciones ---
  const fetchDatosVacaciones = useCallback(async () => {
    if (!userID) return;
    try {
      const res = await axios.get(`${apiBaseUrl}/api/datos-vacaciones/${userID}`);
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

  useEffect(() => {
    if (pestañaSeleccionada === 'Nueva solicitud') {
      setFechaInicioVacaciones('');
      setFechaFinVacaciones('');
      setMensajeError('');
      setMensajeExito('');
      fetchDatosVacaciones();
    }
  }, [pestañaSeleccionada, fetchDatosVacaciones, reloadKey]);

  // --- Enviar solicitud ---
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
      setMensajeError('Selecciona una fecha posterior a la de inicio.');
      return;
    }

    if (inicio.diff(hoy, 'month') < 2) {
      setMensajeError('Elige una fecha al menos 2 meses posterior a la actual.');
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
      const respuesta = await fetch(`${apiBaseUrl}/api/solicitudes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          usuario_id: userID,
          fecha_inicio: fechaInicioVacaciones,
          fecha_fin: fechaFinVacaciones,
          total_dias: diasSolicitados
        })
      });

      if (!respuesta.ok) throw new Error(await respuesta.text());

      setMensajeExito('Solicitud de vacaciones enviada.');
      setFechaInicioVacaciones('');
      setFechaFinVacaciones('');
      await fetchDatosVacaciones();
    } catch (err) {
      setMensajeError(err.message || 'Error al enviar solicitud.');
    }
  };

  // --- Contenido principal ---
  const mostrarContenido = () => {
    switch (pestañaSeleccionada) {
      case 'Nueva solicitud': return <NuevaSolicitud {...{
        anosTrabajados, diasTomados, diasAnuales, diasDisponibles, fechaIngreso,
        fechaFinAnio, fechaInicioVacaciones, setFechaInicioVacaciones,
        fechaFinVacaciones, setFechaFinVacaciones, mensajeError, mensajeExito, enviarSolicitud
      }} />;
      case 'Mis solicitudes': return <Solicitudes userID={userID} />;
      case 'S. Empleados': return <SolicitudesEquipo userID={userID} />;
      case 'Lista de empleados': return <Usuarios userID={userID} />;
      case 'Mi calendario': return <Calendario userID={userID} />;
      case 'C. Empleados': return <CalendarioEquipo userID={userID} />;
      case 'Reportes': return <Reportes userID={userID} />;
      case 'Estadísticas': return <Estadisticas userID={userID} />;
      case 'Ver notificaciones': return <Notificaciones userID={userID} />;
      default: return <p>Pestaña no encontrada.</p>;
    }
  };

  return (
    <div className={`contenedor-dashboard pantalla-completa ${menuColapsado ? 'menu-colapsado' : ''}`}>
      <aside className={`barra-lateral ${menuColapsado ? 'colapsada' : ''}`}>
        <div className="encabezado-barra">
          <h3>{!menuColapsado && 'Panel'}</h3>
          <button className="boton-colapsar" onClick={() => setMenuColapsado(!menuColapsado)} aria-label="Colapsar menú">
            <FaBars />
          </button>
        </div>
        <nav>
          <ul>
            {Object.entries(menu).map(([titulo, data]) => {
              const opciones = data.opciones;
              const grupoActivo =
                desgloceAbierto === titulo ||
                opciones.some(op => op.nombre === pestañaSeleccionada);
              const isOpen = desgloceAbierto === titulo;

              const itemHeight = 40;
              const maxHeight = `${opciones.length * itemHeight}px`;

              return (
                <li key={titulo}>
                  <div
                    className={`menu-titulo ${grupoActivo ? 'activo' : ''}`}
                    onClick={() => toggleDesgloce(titulo)}
                  >
                    <span className="icono-titulo">{data.icono}</span>
                    {!menuColapsado && titulo}
                  </div>

                  <ul
                    className={`sub-menu ${isOpen ? 'abierto' : ''}`}
                    style={{
                      maxHeight: isOpen ? maxHeight : '0px',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                      transition: `max-height ${ANIMATION_MS}ms ease, opacity ${ANIMATION_MS / 1.6}ms ease, transform ${ANIMATION_MS}ms ease`
                    }}
                  >
                    {opciones.map(({ nombre }) => (
                      <li
                        key={nombre}
                        className={pestañaSeleccionada === nombre ? 'activo' : ''}
                        onClick={() => setPestañaSeleccionada(nombre)}
                      >
                        {!menuColapsado && <span className="texto">{nombre}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
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

import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/EmpleadoDashboard.css';
import Solicitudes from '../components/Solicitudes';
import Calendario from '../components/Calendario';
import Notificaciones from '../components/Notificaciones';
import NuevaSolicitud from '../components/NuevaSolicitud';
import { FaPlusCircle, FaListAlt, FaCalendarAlt, FaBell, FaBars } from 'react-icons/fa';
import api from '../services/api';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export default function EmpleadoDashboard({ userID, pestañaActiva, menuColapsado }) {
  // Form / UI
  const [fechaInicioVacaciones, setFechaInicioVacaciones] = useState('');
  const [fechaFinVacaciones, setFechaFinVacaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [loading, setLoading] = useState(false);

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
      icono: <FaListAlt />,
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

  // Estados del acordeón
  const [desgloceAbierto, setDesgloceAbierto] = useState("Solicitudes");
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState("Nueva solicitud");

  // Control de transición secuencial (cerrar -> abrir)
  const ANIMATION_MS = 300; // debe coincidir con CSS
  const switchingTimeoutRef = useRef(null);
  const endSwitchTimeoutRef = useRef(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Manejo del toggle con cierre primero si hay otro abierto
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

  // limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      clearTimeout(switchingTimeoutRef.current);
      clearTimeout(endSwitchTimeoutRef.current);
    };
  }, []);

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
      const res = await api.get(`/datos-vacaciones/${userID}`);
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

  useEffect(() => {
    const handleClickOutside = () => setDesgloceAbierto(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  // Enviar solicitud
  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    // 1️⃣ Validaciones antes de activar spinner
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

    // ✅ Activar loading solo si ya pasó las validaciones
    setLoading(true);

    try {
      // Obtener días inhábiles
      const resp = await api.get('/dias-inhabiles');
      const diasInhabiles = resp.data;

      const diasInhabilesDayjs = diasInhabiles.map(d => ({
        siempre: d.siempre === 1,
        fecha: dayjs(d.fecha)
      }));

      // Calcular días hábiles
      let diasSolicitados = 0;
      let diaActual = inicio.clone();
      const finInclusive = fin.clone().add(1, 'day');

      while (diaActual.isBefore(finInclusive, 'day')) {
        const diaSemana = diaActual.day();
        if (diaSemana === 0 || diaSemana === 6) {
          diaActual = diaActual.add(1, 'day');
          continue;
        }

        const esInhabil = diasInhabilesDayjs.some(dia => {
          if (dia.siempre) {
            return dia.fecha.date() === diaActual.date() && dia.fecha.month() === diaActual.month();
          } else {
            return dia.fecha.isSame(diaActual, 'day');
          }
        });

        if (!esInhabil) diasSolicitados++;
        diaActual = diaActual.add(1, 'day');
      }

      if (diasSolicitados > diasDisponibles) {
        setMensajeError(`No puedes solicitar ${diasSolicitados} días. Solo tienes ${diasDisponibles} disponibles.`);
        return;
      }

      // Enviar solicitud
      const respuesta = await api.post('/solicitudes', {
        usuario_id: userID,
        fecha_inicio: fechaInicioVacaciones,
        fecha_fin: fechaFinVacaciones,
        total_dias: diasSolicitados
      });

      setMensajeExito('Solicitud enviada. Puedes editar o cancelar mientras se encuentre pendiente.');
      setFechaInicioVacaciones('');
      setFechaFinVacaciones('');
      await fetchDatosVacaciones();

    } catch (err) {
      console.error(err);
      setMensajeError(err.message || 'Error al enviar solicitud.');
    } finally {
      setLoading(false); // 🔹 detener spinner siempre
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
            loading={loading}
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
        </div>
        <nav>
          <ul>
            {Object.keys(menu).map((titulo) => {
              const opciones = menu[titulo].opciones;
              const isOpen = desgloceAbierto === titulo;
              const grupoActivo = isOpen || opciones.some(op => op.nombre === pestañaSeleccionada);
              const itemHeight = 40;
              const maxHeight = `${opciones.length * itemHeight}px`;

              return (
                <li key={titulo} className="grupo-menu">
                  <div
                    className={`menu-titulo ${grupoActivo ? 'activo' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (menuColapsado) {
                        setDesgloceAbierto(desgloceAbierto === titulo ? null : titulo);
                      } else {
                        setDesgloceAbierto(desgloceAbierto === titulo ? null : titulo);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="icono-titulo">{menu[titulo].icono}</span>
                    {!menuColapsado && titulo}
                  </div>

                  {/* Submenú normal (no colapsado) */}
                  {!menuColapsado && (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setPestañaSeleccionada(nombre);
                          }}
                        >
                          {!menuColapsado && <span className="texto">{nombre}</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Submenú flotante (solo colapsado) */}
                  {menuColapsado && desgloceAbierto === titulo && (
                    <ul className="submenu-flotante" onClick={(e) => e.stopPropagation()}>
                      {/* 🔹 Aquí agregamos el título del grupo */}
                      <li className="submenu-titulo">
                        <strong>{titulo}</strong>
                      </li>

                      {opciones.map(({ nombre }) => (
                        <li
                          key={nombre}
                          className={pestañaSeleccionada === nombre ? 'activo' : ''}
                          onClick={() => {
                            setPestañaSeleccionada(nombre);
                            setDesgloceAbierto(null);
                          }}
                        >
                          {nombre}
                        </li>
                      ))}
                    </ul>
                  )}
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

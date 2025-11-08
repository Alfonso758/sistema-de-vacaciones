import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/EmpleadoDashboard.css';
import SolicitudesEquipo from '../components/SolicitudesEquipo';
import SolicitudesJefes from '../components/SolicitudesJefes';
import DiasAcumulables from '../components/DiasAcumulables';
import UsuariosPend from '../components/UsuariosPend';
import Usuarios from '../components/Usuarios';
import CalendarioEquipo from '../components/CalendarioEquipo';
import CalendarioJefes from '../components/CalendarioJefes';
import DiasInhabiles from '../components/DiasInhabiles';
import ReportesTodos from '../components/ReportesTodos';
import EstadisticasTodas from '../components/EstadisticasTodas';
import Notificaciones from '../components/Notificaciones';
import { FaUsers, FaListAlt, FaCalendarAlt, FaBell, FaBars, FaChartPie, FaCog } from 'react-icons/fa';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export default function AdminDashboard({ userID, pestañaActiva, menuColapsado }) {
  // Menú tipo acordeón con iconos en títulos y opciones
  const menu = {
    "Solicitudes": {
      icono: <FaListAlt />,
      opciones: [
        { nombre: "S. Empleados" },
        { nombre: "S. Jefes de área" },
        { nombre: "Días acumulables" }
      ]
    },
    "Usuarios": {
      icono: <FaUsers />,
      opciones: [
        { nombre: "Usuarios nuevos" },
        { nombre: "Lista de usuarios" }
      ]
    },
    "Calendario": {
      icono: <FaCalendarAlt />,
      opciones: [
        { nombre: "C. Empleados" },
        { nombre: "C. Jefes de área" },
        { nombre: "Días inhábiles" }
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
    /*"Configuración": {
      icono: <FaCog />,
      opciones: [
        { nombre: "Gestión del área" }
      ]
    }*/
  };

  // Estados del acordeón
  const [desgloceAbierto, setDesgloceAbierto] = useState("Solicitudes");
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState("S. Empleados");

  // Control de transición secuencial (cerrar -> abrir)
  const ANIMATION_MS = 300; // debe coincidir con CSS
  const switchingTimeoutRef = useRef(null);
  const endSwitchTimeoutRef = useRef(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const barraRef = useRef(null);

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

  useEffect(() => {
    if (!menuColapsado) return; // 👉 Solo escuchar clics si la barra está colapsada

    const handleClickOutside = (e) => {
      if (barraRef.current && !barraRef.current.contains(e.target)) {
        setDesgloceAbierto(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuColapsado]);

  // Contenido según pestaña
  const mostrarContenido = () => {
    switch (pestañaSeleccionada) {
      case 'S. Empleados':
        return <SolicitudesEquipo userID={userID} />;

      case 'S. Jefes de área':
        return <SolicitudesJefes userID={userID} />;

      case 'Días acumulables':
        return <DiasAcumulables userID={userID} />;

      case 'Usuarios nuevos':
        return <UsuariosPend userID={userID} />;

      case 'Lista de usuarios':
        return <Usuarios userID={userID} />;

      case 'C. Empleados':
        return <CalendarioEquipo userID={userID} />;

      case 'C. Jefes de área':
        return <CalendarioJefes userID={userID} />;

      case 'Días inhábiles':
        return <DiasInhabiles userID={userID} />;

      case 'Reportes':
        return <ReportesTodos userID={userID} />;

      case 'Estadísticas':
        return <EstadisticasTodas userID={userID} />;

      case 'Ver notificaciones':
        return <Notificaciones userID={userID} />;

      default:
        return <p>Pestaña no encontrada.</p>;
    }
  };

  return (
    <div className={`contenedor-dashboard pantalla-completa ${menuColapsado ? 'menu-colapsado' : ''}`}>
      <aside ref={barraRef} className={`barra-lateral ${menuColapsado ? 'colapsada' : ''}`}>
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

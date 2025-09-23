import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/EmpleadoDashboard.css';
import SolicitudesEquipo from '../components/SolicitudesEquipo';
import Calendario from '../components/Calendario';
import Notificaciones from '../components/Notificaciones';
import { FaUsers, FaListAlt, FaCalendarAlt, FaBell, FaBars, FaChartPie, FaCog } from 'react-icons/fa';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export default function AdminDashboard({ userID, pestañaActiva }) {
  // Form / UI
  const [menuColapsado, setMenuColapsado] = useState(false);

  // Menú tipo acordeón con iconos en títulos y opciones
  const menu = {
    "Solicitudes": {
      icono: <FaListAlt />,
      opciones: [
        { nombre: "Empleados" },
        { nombre: "Jefes de área" }
      ]
    },
    "Usuarios": {
      icono: <FaUsers />,
      opciones: [
        { nombre: "Usuarios pendientes" },
        { nombre: "Lista de usuarios" }
      ]
    },
    "Calendario": {
      icono: <FaCalendarAlt />,
      opciones: [
        { nombre: "Ver calendario" }
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
    "Configuración": {
      icono: <FaCog />,
      opciones: [
        { nombre: "Gestión del área" }
      ]
    }
  };

  // Estados del acordeón
  const [desgloceAbierto, setDesgloceAbierto] = useState("Solicitudes");
  const [pestañaSeleccionada, setPestañaSeleccionada] = useState(menu["Solicitudes"].opciones[0].nombre);

  // Control de transición secuencial (cerrar -> abrir)
  const ANIMATION_MS = 300; // debe coincidir con CSS
  const switchingTimeoutRef = useRef(null);
  const endSwitchTimeoutRef = useRef(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Manejo del toggle con cierre primero si hay otro abierto
  const toggleDesgloce = (titulo) => {
    if (isSwitching) return; // evita clicks durante la animación
    // si clic en el mismo: cerrar
    if (desgloceAbierto === titulo) {
      setDesgloceAbierto(null);
      return;
    }
    // si no hay ninguno abierto: abrir inmediatamente
    if (desgloceAbierto === null) {
      setDesgloceAbierto(titulo);
      setPestañaSeleccionada(menu[titulo].opciones[0].nombre);
      return;
    }

    // hay otro abierto: cerrar primero, luego abrir el nuevo
    setIsSwitching(true);
    // cerrar actual
    setDesgloceAbierto(null);

    // despues de la animación de cierre, abrir el nuevo
    clearTimeout(switchingTimeoutRef.current);
    switchingTimeoutRef.current = setTimeout(() => {
      setDesgloceAbierto(titulo);
      setPestañaSeleccionada(menu[titulo].opciones[0].nombre);

      // permitir nuevas acciones cuando termine la apertura
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

  // Contenido según pestaña
  const mostrarContenido = () => {
    switch (pestañaSeleccionada) {
      case 'Empleados':
        return <SolicitudesEquipo userID={userID} />;

      case 'Todas las solicitudes':
        return <SolicitudesEquipo userID={userID} />;

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
            {Object.keys(menu).map((titulo) => {
              const opciones = menu[titulo].opciones;
              const isOpen = desgloceAbierto === titulo;
              // calcular altura dinámica del sub-menu (por item) para transición suave
              const itemHeight = 40; // ajustar si tu li tiene otra altura
              const maxHeight = `${opciones.length * itemHeight}px`;

              return (
                <li key={titulo}>
                  <div
                    className={`menu-titulo ${isOpen ? 'activo' : ''}`}
                    onClick={() => toggleDesgloce(titulo)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="icono-titulo">{menu[titulo].icono}</span>
                    {!menuColapsado && titulo}
                  </div>

                  {/* sub-menu siempre en DOM; controlamos apertura por estilo */}
                  <ul
                    className={`sub-menu ${isOpen ? 'abierto' : ''}`}
                    style={{
                      maxHeight: isOpen ? maxHeight : '0px',
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                      transition: `max-height ${ANIMATION_MS}ms ease, opacity ${ANIMATION_MS / 1.6}ms ease, transform ${ANIMATION_MS}ms ease`
                    }}
                  >
                    {opciones.map(({ nombre, icono }) => (
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

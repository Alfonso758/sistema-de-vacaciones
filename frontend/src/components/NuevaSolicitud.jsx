import { useState, useEffect } from 'react';
import '../styles/NuevaSolicitud.css';

export default function NuevaSolicitud({
  anosTrabajados,
  diasTomados,
  diasAnuales,
  diasDisponibles,
  fechaIngreso,
  fechaFinAnio,
  fechaInicioVacaciones,
  setFechaInicioVacaciones,
  fechaFinVacaciones,
  setFechaFinVacaciones,
  mensajeError,
  mensajeExito,
  enviarSolicitud,
  loading
}) {
  return (
    <>
      <div className="content">
        <div className="tarjeta_content">
          <div className="tarjeta">
            <span className="valor">{anosTrabajados}</span>
            <p>
              Años laborando<br />
              <small>Desde {fechaIngreso}</small>
            </p>
          </div>

          <div className="tarjeta">
            <span className="valor">{diasTomados}/{diasAnuales}</span>
            <p>
              Días tomados<br />
              <small>Este año</small>
            </p>
          </div>

          <div className="tarjeta">
            <span className="valor">{diasDisponibles}</span>
            <p>
              Días disponibles<br />
              <small>Hasta {fechaFinAnio}</small>
            </p>
          </div>
        </div>
      </div>

      <h2 className='titulo1'>Nueva solicitud</h2>
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
                title="Selecciona una fecha con al menos 2 meses de anticipación."
                disabled={loading}
              />
            </div>

            <div className="grupo-input">
              <label>Fecha de Fin</label>
              <input
                type="date"
                value={fechaFinVacaciones}
                onChange={(e) => setFechaFinVacaciones(e.target.value)}
                title="Selecciona una fecha posterior a la fecha de inicio."
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ margin: 'auto', display: 'block', background: 'none' }}
                  width="24"
                  height="24"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid"
                >
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="10"
                    r="35"
                    strokeDasharray="164.93361431346415 56.97787143782138"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      repeatCount="indefinite"
                      dur="1s"
                      values="0 50 50;360 50 50"
                      keyTimes="0;1"
                    />
                  </circle>
                </svg>
              ) : 'Enviar Solicitud'}
            </button>

            {mensajeError && <p className="mensaje-error">{mensajeError}</p>}
            {mensajeExito && <p className="mensaje-exito">{mensajeExito}</p>}
          </form>
        </div>
      </div>
    </>
  );
}

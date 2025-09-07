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
  enviarSolicitud
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
}

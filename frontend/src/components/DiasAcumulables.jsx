import React, { useState, useEffect } from "react";
import "../styles/DiasAcumulables.css";

export default function DiasAcumulables() {
  const [diasAcumulables, setDiasAcumulables] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    console.log("🟢 Obteniendo días acumulables y usuarios...");

    // Fetch de los días acumulables
    const fetchDias = fetch("http://localhost:8000/api/acumulables", {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(res => res.json());

    // Fetch de todos los usuarios
    const fetchUsuarios = fetch("http://localhost:8000/api/usuarios", {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(res => res.json());

    Promise.all([fetchDias, fetchUsuarios])
      .then(([diasData, usuariosData]) => {
        const filtrados = diasData.filter(v => v.pendiente > 0);

        // Mapear el nombre del usuario a cada registro
        const registrosConNombre = filtrados.map(registro => {
          const usuario = usuariosData.find(u => u.id === registro.id_usuario);
          return { 
            ...registro, 
            nombreUsuario: usuario ? `${usuario.name} ${usuario.surnames}`.trim() : "Desconocido" 
          };
        });

        setDiasAcumulables(registrosConNombre);
        setUsuarios(usuariosData);
      })
      .catch(err => console.error("❌ Error al obtener datos:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
  };

  const acumularDias = (id) => {
    console.log("Acumular días del registro:", id);
  };

  const dejarPerderDias = (id) => {
    console.log("Dejar perder días del registro:", id);
  };

  return (
    <div className="dias-acumulables-container">
      <h2>Días Acumulables</h2>

      {loading ? (
        <p className="cargando">Cargando días acumulables...</p>
      ) : diasAcumulables.length === 0 ? (
        <p className="sin-datos">No hay días acumulables pendientes.</p>
      ) : (
        <div className="etiquetas-dias">
          {diasAcumulables.map((registro) => (
            <div key={registro.id} className="etiqueta-dia">
              <p>
                🔹 A <b>{registro.nombreUsuario}</b> se le vencieron{" "}
                <b>{registro.pendiente}</b> días del periodo{" "}
                <b>{formatFecha(registro.fecha_inicio_periodo)}</b> al{" "}
                <b>{formatFecha(registro.fecha_fin_periodo)}</b>.
              </p>
              <div className="botones-acciones">
                <button onClick={() => acumularDias(registro.id)}>Acumular</button>
                <button onClick={() => dejarPerderDias(registro.id)}>Dejar perder</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

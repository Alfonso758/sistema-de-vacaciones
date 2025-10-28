import React, { useState, useEffect } from "react";
import "../styles/DiasAcumulables.css";

export default function DiasAcumulables() {
  const [diasAcumulables, setDiasAcumulables] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoton, setLoadingBoton] = useState({});
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");

    console.log("Obteniendo días acumulables y usuarios...");

    // Fetch de los días acumulables
    const fetchDias = fetch(`${apiBaseUrl}/api/acumulables`, {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(res => res.json());

    // Fetch de todos los usuarios
    const fetchUsuarios = fetch(`${apiBaseUrl}/api/usuarios`, {
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
      .catch(err => console.error("Error al obtener datos:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
  };

  const acumularDias = async (id) => {
    if (!window.confirm("¿Deseas acumular los días vencidos de este usuario?")) return;

    const accion = "acumular";
    setLoadingBoton(prev => ({ ...prev, [id]: accion }));

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBaseUrl}/api/acumular-dias/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al acumular los días");

      const data = await res.json();

      alert(data.message);
      setDiasAcumulables(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al acumular:", err);
      alert("Error al acumular los días. Intenta nuevamente.");
    } finally {
      setLoadingBoton(prev => ({ ...prev, [id]: null }));
    }
  };

  const dejarPerderDias = async (id) => {
    if (!window.confirm("¿Seguro que deseas dejar perder los días vencidos de este usuario? Esta acción no se puede deshacer.")) return;

    const accion = "perder";
    setLoadingBoton(prev => ({ ...prev, [id]: accion }));

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBaseUrl}/api/dejar-perder-dias/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al dejar perder los días");

      const data = await res.json();

      alert(data.message);
      setDiasAcumulables(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al dejar perder:", err);
      alert("Error al dejar perder los días. Intenta nuevamente.");
    } finally {
      setLoadingBoton(prev => ({ ...prev, [id]: null }));
    }
  };


  return (
    <div className="dias-acumulables-container">
      <h2>Días Acumulables</h2>
      <p>Nota: Los días vencidos se eliminarán automáticamente si no se acumulan en 72 horas.</p>

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
                <button onClick={() => acumularDias(registro.id)} disabled={loadingBoton[registro.id]}>
                  {loadingBoton[registro.id] === 'acumular' ? (
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
                  ) : 'Acumular'}
                </button>

                <button onClick={() => dejarPerderDias(registro.id)} disabled={loadingBoton[registro.id]}>
                  {loadingBoton[registro.id] === 'perder' ? (
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
                  ) : 'Dejar perder'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

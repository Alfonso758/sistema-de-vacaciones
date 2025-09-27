import { useEffect, useState } from "react";
import '../styles/UsuariosPend.css';
import { FaUser } from 'react-icons/fa';

export default function UsuariosPend(userID) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/usuarios/pendientes", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error al obtener usuarios");
      const data = await response.json();
      setUsuarios(data.data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const asignarRol = async (id, nuevoRol) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/usuarios/${id}/rol`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rol_id: nuevoRol })
      });

      if (!response.ok) throw new Error("Error al asignar rol");

      const data = await response.json();
      alert(data.message);

      // refrescar lista
      fetchUsuarios();

    } catch (err) {
      console.error("Error asignando rol:", err);
    }
  };

  if (loading) return <p>Cargando usuarios pendientes...</p>;

  return (
    <div className="usuarios-pend-wrapper">
      <h2>Usuarios pendientes</h2>
      {usuarios.length === 0 ? (
        <p>No hay usuarios pendientes.</p>
      ) : (
        <ul className="usuarios-lista">
          {usuarios.map((u) => (
            <li key={u.id} className="usuario-item">
              <FaUser className="icono-usuario" />
              <span>{u.name} {u.surnames}</span>
              <select onChange={(e) => asignarRol(u.id, e.target.value)} defaultValue="">
                <option value="" disabled>Asignar rol</option>
                <option value="2">Jefe</option>
                <option value="3">Empleado</option>
                <option value="4">Administrador</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

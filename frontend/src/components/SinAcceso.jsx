import { useState, useEffect } from 'react';
import '../styles/SinAcceso.css';

function SinAcceso() {

    return (
        <div className="sin-acceso-wrapper">
            <h2>Bienvenido al sistema de vacaciones Soko Labs</h2>
            <label className="main-label">
                No tienes acceso al sistema hasta que un administrador active tu cuenta.
            </label>
        </div>
    );
}

export default SinAcceso;

<?php

return [
    // Rutas que aplican CORS (normalmente las APIs)
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Métodos HTTP permitidos
    'allowed_methods' => ['*'], // GET, POST, PUT, DELETE, OPTIONS...

    // Dominios que pueden acceder a tu backend
    'allowed_origins' => [
        'https://vacaciones.sokodev.com', // dominio en producción (HTTPS)
        'http://localhost:5173',           // entorno local de desarrollo (Vite)
    ],

    // Patrón de orígenes (puede quedar vacío)
    'allowed_origins_patterns' => [],

    // Cabeceras permitidas
    'allowed_headers' => ['*'], // Authorization, Content-Type, etc.

    // Cabeceras expuestas al frontend
    'exposed_headers' => [],

    // Tiempo máximo que el navegador puede cachear la respuesta preflight
    'max_age' => 0,

    // Permitir envío de cookies o credenciales en las solicitudes
    'supports_credentials' => true,
];

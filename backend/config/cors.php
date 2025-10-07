<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Aquí se configuran los orígenes permitidos, métodos y cabeceras para
    | solicitudes desde otros dominios (como tu frontend en React).
    |
    */

    // Rutas que aplican CORS
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Métodos permitidos
    'allowed_methods' => ['*'], // Permite GET, POST, PUT, DELETE, OPTIONS...

    // Orígenes permitidos
    'allowed_origins' => ['http://localhost:5173'], // tu frontend explícitamente

    // Patrón de orígenes permitidos (puedes dejar vacío)
    'allowed_origins_patterns' => [],

    // Cabeceras permitidas
    'allowed_headers' => ['*'], // Permite Authorization, Content-Type, etc.

    // Cabeceras que pueden exponerse al frontend
    'exposed_headers' => [],

    // Tiempo máximo de cache de preflight (en segundos)
    'max_age' => 0,

    // Permite enviar cookies / Authorization headers
    'supports_credentials' => true,
];

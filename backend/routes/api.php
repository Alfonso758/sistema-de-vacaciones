<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\VacacionesController;

/*
|--------------------------------------------------------------------------
| Rutas públicas (sin autenticación)
|--------------------------------------------------------------------------
*/

// 🔹 Autenticación de usuarios
Route::post('/login', [UsuarioController::class, 'login']);
Route::post('/register', [UsuarioController::class, 'register']);

// 🔹 Solicitudes
Route::prefix('solicitudes')->group(function () {
    // Crear nueva solicitud
    Route::post('/', [SolicitudController::class, 'store']);

    // Mostrar solicitud específica
    Route::get('/{id}', [SolicitudController::class, 'show']);

    // Listado de solicitudes por usuario
    Route::get('/usuario/{usuario_id}', [SolicitudController::class, 'index']);

    // Actualizar solicitud específica
    Route::put('/{id}', [SolicitudController::class, 'update']);

    // Eliminar solicitud por ID
    Route::delete('/{id}', [SolicitudController::class, 'destroy']);

    // Cancelar una solicitud (cambia el estado a Cancelada)
    Route::put('/{id}/cancelar', [SolicitudController::class, 'cancelar']);
});

// 🔹 Listado de solicitudes por usuario
Route::get('/usuarios/{usuario_id}/solicitudes', [SolicitudController::class, 'index']);

// 🔹 Jefes directos
Route::get('/jefes', [UsuarioController::class, 'getJefes']);

// 🔹 Datos de vacaciones de un usuario
Route::get('/datos-vacaciones/{usuario}', [VacacionesController::class, 'getDatos']);

/*
|--------------------------------------------------------------------------
| Rutas protegidas (requieren autenticación con Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // 🔹 Obtener usuario logueado
    Route::get('/user', [UsuarioController::class, 'me']);

    // 🔹 Cerrar sesión
    Route::post('/logout', [UsuarioController::class, 'logout']);

    // 🔹 Opcional: mover rutas de solicitudes protegidas aquí si deseas seguridad
    // Route::prefix('solicitudes')->group(function () {
    //     Route::delete('/{id}', [SolicitudController::class, 'destroy']);
    // });
});

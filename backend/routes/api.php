<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\VacacionesController;
use App\Http\Controllers\DiaInhabilController;
use App\Http\Controllers\Auth\GoogleController;

/*
|--------------------------------------------------------------------------
| Rutas públicas (sin autenticación)
|--------------------------------------------------------------------------
*/

// 🔹 Autenticación de usuarios
Route::post('/google-login', [GoogleController::class, 'login']);
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

// 🔹 Días inhábiles
Route::prefix('dias-inhabiles')->group(function () {
    // Listar todos los días inhábiles
    Route::get('/', [DiaInhabilController::class, 'index']);

    // Crear nuevo día inhábil
    Route::post('/', [DiaInhabilController::class, 'store']);

    // Mostrar día inhábil específico
    Route::get('/{id}', [DiaInhabilController::class, 'show']);

    // Actualizar día inhábil específico
    Route::put('/{id}', [DiaInhabilController::class, 'update']);

    // Eliminar día inhábil específico
    Route::delete('/{id}', [DiaInhabilController::class, 'destroy']);
});



// 🔹 Listado de solicitudes por usuario
Route::get('/usuarios/{usuario_id}/solicitudes', [SolicitudController::class, 'index']);

// 🔹 Jefes directos
Route::get('/jefes', [UsuarioController::class, 'getJefes']);

// 🔹 Datos de vacaciones de un usuario
Route::get('/datos-vacaciones/{usuario}', [VacacionesController::class, 'getDatos']);

// 🔹 Días de vacaciones de un usuario para el calendario
Route::get('/vacaciones/{usuario_id}', [VacacionesController::class, 'aprobadas']);

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

    // 🔹 cambiar contraseña
    Route::post('/usuarios/cambiar-password', [UsuarioController::class, 'cambiarPassword']);

    // Cambiar avatar
    Route::post('/usuarios/avatar', [UsuarioController::class, 'cambiarAvatar']);

    // Agregar jefe y fecha de ingreso
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);

});

// Actualizar nombre y apellidos del usuario logueado
Route::middleware('auth:sanctum')->put('/usuario/actualizar', [UsuarioController::class, 'actualizar']);
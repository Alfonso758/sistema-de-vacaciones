<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\VacacionesController;
use App\Http\Controllers\DiaInhabilController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\GoogleCalendarController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\EstadisticasController;

/*
|--------------------------------------------------------------------------
| Rutas públicas (sin autenticación)
|--------------------------------------------------------------------------
*/

// 🔹 Autenticación de usuarios
Route::post('/google-login', [GoogleController::class, 'login']);
Route::post('/login', [UsuarioController::class, 'login']);
Route::post('/register', [UsuarioController::class, 'register']);
Route::get('/empleados/{jefeId}', [UsuarioController::class, 'empleadosDelJefe']);
Route::get('/usuarios', [UsuarioController::class, 'usuarios']);
Route::get('/usuarios/pendientes', [UsuarioController::class, 'usuariosPend']);
Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
Route::put('/usuarios/{id}/activar', [UsuarioController::class, 'activarUsuario']);

// 🔹 Solicitudes
Route::prefix('solicitudes')->group(function () {
    Route::post('/', [SolicitudController::class, 'store']); // Crear solicitud
    Route::get('/{id}', [SolicitudController::class, 'show']); // Mostrar solicitud
    Route::get('/usuario/{usuario_id}', [SolicitudController::class, 'index']); // Listado por usuario
    Route::put('/{id}', [SolicitudController::class, 'update']); // Actualizar
    Route::delete('/{id}', [SolicitudController::class, 'destroy']); // Eliminar
    Route::put('/{id}/cancelar', [SolicitudController::class, 'cancelar']); // Cancelar

    // 🔹 Aprobar o rechazar una solicitud (decisión)
    Route::put('/{id}/decision', [SolicitudController::class, 'decision']);

    // 🔹 Cargar solicitudes de empleados a jefes
    Route::get('/equipo/{jefeId}', [SolicitudController::class, 'solicitudesEquipo']);
    Route::get('/jefes/{jefeId}', [SolicitudController::class, 'solicitudesJefes']);
    Route::get('/reporte/{jefeId}', [SolicitudController::class, 'solicitudesReporte']);
});

// 🔹 Días inhábiles
Route::prefix('dias-inhabiles')->group(function () {
    Route::get('/', [DiaInhabilController::class, 'index']);
    Route::post('/', [DiaInhabilController::class, 'store']);
    Route::get('/{id}', [DiaInhabilController::class, 'show']);
    Route::put('/{id}', [DiaInhabilController::class, 'update']);
    Route::delete('/{id}', [DiaInhabilController::class, 'destroy']);
});

// 🔹 Notificaciones
Route::prefix('notificaciones')->group(function () {
    Route::get('/', [NotificacionController::class, 'index']);
    Route::post('/', [NotificacionController::class, 'store']);
    Route::get('/{id}', [NotificacionController::class, 'show']);
    Route::put('/{id}', [NotificacionController::class, 'update']);
    Route::delete('/{id}', [NotificacionController::class, 'destroy']);
});

// Estadisticas}
Route::get('/estadisticas/{anio}', [EstadisticasController::class, 'mostrarPorAnio']);
Route::get('/estadisticasTodas/{anio}', [EstadisticasController::class, 'mostrarPorAnioTodas']);

// 🔹 Otras rutas públicas
Route::get('/usuarios/{usuario_id}/solicitudes', [SolicitudController::class, 'index']);
Route::get('/jefes', [UsuarioController::class, 'getJefes']);
Route::get('/datos-vacaciones/{usuario}', [VacacionesController::class, 'getDatos']);
Route::get('/vacacionesPropias/{usuario_id}', [VacacionesController::class, 'aprobadasPropias']);
Route::get('/vacaciones/{usuario_id}', [VacacionesController::class, 'aprobadas']);
Route::get('/vacacionesJefes/{usuario_id}', [VacacionesController::class, 'aprobadasJefes']);
Route::get('/google-auth', [GoogleCalendarController::class, 'redirectToGoogle']);
Route::get('/callback', [GoogleCalendarController::class, 'handleCallback']);

/*
|--------------------------------------------------------------------------
| Rutas protegidas (requieren autenticación con Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UsuarioController::class, 'me']); // Usuario logueado
    Route::post('/logout', [UsuarioController::class, 'logout']); // Logout
    Route::post('/usuarios/cambiar-password', [UsuarioController::class, 'cambiarPassword']);
    Route::post('/usuarios/avatar', [UsuarioController::class, 'cambiarAvatar']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']); // Actualizar jefe y fecha
    Route::put('/usuario/actualizar', [UsuarioController::class, 'actualizar']); // Actualizar nombre y apellidos
    Route::get('/acumulables', [SolicitudController::class, 'diasAcumulables']);
});

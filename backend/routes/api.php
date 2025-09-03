<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NuevaSolicitudController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\Jefes_directos;
use App\Http\Controllers\VacacionesController;
use App\Http\Controllers\EditarSolicitudController;

/*
|--------------------------------------------------------------------------
| Rutas públicas (sin auth)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Crear una nueva solicitud
Route::post('/solicitudes', [NuevaSolicitudController::class, 'store']);

// Obtener todas las solicitudes de un usuario (LISTADO)
Route::get('/usuarios/{usuario_id}/solicitudes', [SolicitudController::class, 'index']);

// Jefes directos
Route::get('/jefes', [Jefes_directos::class, 'getJefes']);

// Datos de vacaciones de un usuario
Route::get('/datos-vacaciones/{usuario}', [VacacionesController::class, 'getDatos']);

// Obtener una solicitud específica
Route::get('/solicitudes/{id}', [EditarSolicitudController::class, 'show']);

// Actualizar una solicitud específica
Route::put('/solicitudes/{id}', [EditarSolicitudController::class, 'update']);

/*
|--------------------------------------------------------------------------
| Rutas protegidas (requieren auth)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

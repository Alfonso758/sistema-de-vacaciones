<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NuevaSolicitudController;
use App\Http\Controllers\SolicitudController;
use App\Http\Controllers\Jefes_directos;
use App\Http\Controllers\VacacionesController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/solicitudes', [NuevaSolicitudController::class, 'store']);
Route::get('/solicitudes/{usuario_id}', [SolicitudController::class, 'index']);
Route::get('/jefes', [Jefes_directos::class, 'getJefes']);
Route::get('/datos-vacaciones/{usuario}', [VacacionesController::class, 'getDatos']);



Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

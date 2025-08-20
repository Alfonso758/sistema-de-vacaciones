<?php

namespace App\Http\Controllers;

use App\Models\MostrarSolicitudes;
use Illuminate\Http\Request;

class SolicitudController extends Controller
{
    // Obtener todas las solicitudes de un usuario
    public function index($usuario_id)
    {
        $solicitudes = MostrarSolicitudes::with(['usuario', 'revisor'])
            ->where('usuario_id', $usuario_id)
            ->get();

        return response()->json($solicitudes);
    }
}

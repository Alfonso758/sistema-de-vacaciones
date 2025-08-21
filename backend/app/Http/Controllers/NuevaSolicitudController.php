<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NuevaSolicitud;

class NuevaSolicitudController  extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $solicitud = NuevaSolicitud::create([
            'usuario_id' => $request->usuario_id,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
            'fecha_solicitud' => now(),
            'estado_solicitud' => 1
        ]);

        return response()->json(['message' => 'Solicitud registrada', 'solicitud' => $solicitud], 201);
    }
}

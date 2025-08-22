<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NuevaSolicitud;
use Carbon\Carbon;

class NuevaSolicitudController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        // Sumar 1 día a las fechas
        $fechaInicio = Carbon::parse($request->fecha_inicio)->addDay()->format('Y-m-d');
        $fechaFin = Carbon::parse($request->fecha_fin)->addDay()->format('Y-m-d');

        $solicitud = NuevaSolicitud::create([
            'usuario_id' => $request->usuario_id,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'fecha_solicitud' => now(),
            'estado_solicitud' => 1
        ]);

        return response()->json(['message' => 'Solicitud registrada', 'solicitud' => $solicitud], 201);
    }
}

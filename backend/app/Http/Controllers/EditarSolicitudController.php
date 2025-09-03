<?php

namespace App\Http\Controllers;

use App\Models\NuevaSolicitud;
use Illuminate\Http\Request;

class EditarSolicitudController extends Controller
{
    public function show($id)
    {
        $solicitud = NuevaSolicitud::find($id);

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        return response()->json($solicitud);
    }

    public function update(Request $request, $id)
    {
        $solicitud = NuevaSolicitud::find($id);

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        $validated = $request->validate([
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $solicitud->update($validated);

        return response()->json([
            'message' => 'Solicitud actualizada correctamente',
            'solicitud' => $solicitud
        ]);
    }
}

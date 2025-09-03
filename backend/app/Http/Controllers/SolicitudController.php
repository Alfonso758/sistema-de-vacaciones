<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SolicitudController extends Controller
{
    /**
     * Obtener todas las solicitudes de un usuario
     */
    public function index($usuario_id)
    {
        $solicitudes = Solicitud::with(['usuario', 'revisor'])
            ->where('usuario_id', $usuario_id)
            ->get();

        return response()->json($solicitudes);
    }

    /**
     * Obtener una solicitud por ID
     */
    public function show($id)
    {
        $solicitud = Solicitud::find($id);

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        return response()->json($solicitud);
    }

    /**
     * Crear nueva solicitud
     */
    public function store(Request $request)
    {
        $request->validate([
            'usuario_id' => 'required|integer|exists:users,id',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        // Sumar 1 día si quieres (como en tu código original)
        $fechaInicio = Carbon::parse($request->fecha_inicio)->addDay()->format('Y-m-d');
        $fechaFin = Carbon::parse($request->fecha_fin)->addDay()->format('Y-m-d');

        $solicitud = Solicitud::create([
            'usuario_id' => $request->usuario_id,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'fecha_solicitud' => now(),
            'estado_solicitud' => 1
        ]);

        return response()->json(['message' => 'Solicitud registrada', 'solicitud' => $solicitud], 201);
    }

    /**
     * Actualizar una solicitud
     */
    public function update(Request $request, $id)
    {
        $solicitud = Solicitud::find($id);

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

    /**
     * Cancelar una solicitud (cambiar estado a Cancelada)
     */
    public function cancelar($id)
    {
        $solicitud = Solicitud::find($id);

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        $solicitud->update(['estado_solicitud' => 4]);

        return response()->json(['message' => 'Solicitud cancelada', 'solicitud' => $solicitud]);
    }

    /**
     * Eliminar una solicitud
     */
    public function destroy($id)
    {
        $solicitud = Solicitud::find($id);

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        $solicitud->delete();

        return response()->json(['message' => 'Solicitud eliminada']);
    }
}

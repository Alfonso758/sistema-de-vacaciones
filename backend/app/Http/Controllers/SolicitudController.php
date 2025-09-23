<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Usuario;
use App\Models\solicitudesVacaciones;

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

        $fechaInicio = Carbon::parse($request->fecha_inicio)->format('Y-m-d');
        $fechaFin = Carbon::parse($request->fecha_fin)->format('Y-m-d');

        // Buscar el usuario
        $usuario = Usuario::findOrFail($request->usuario_id);

        // Si el rol_id del usuario es 2 -> estado_solicitud = 2
        $estado = ($usuario->rol_id == 2) ? 2 : 1;

        $solicitud = Solicitud::create([
            'usuario_id' => $usuario->id,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'fecha_solicitud' => now(),
            'estado_solicitud' => $estado
        ]);

        return response()->json([
            'message' => 'Solicitud registrada',
            'solicitud' => $solicitud
        ], 201);
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

    public function solicitudesEquipo($jefeId)
    {
        // 1. Buscar empleados del jefe
        $empleados = Usuario::where('jefe_directo', $jefeId)->pluck('id');

        // 2. Buscar solicitudes de esos empleados (todas: pendientes, aprobadas, rechazadas)
        $solicitudes = solicitudesVacaciones::whereIn('usuario_id', $empleados)
            ->with(['usuario', 'revisor']) // ahora trae info del empleado y del revisor
            ->get();

        return response()->json($solicitudes);
    }

    public function solicitudesReporte($jefeId)
    {
        $empleados = Usuario::where('jefe_directo', $jefeId)->pluck('id');

        $solicitudes = Solicitud::whereIn('usuario_id', $empleados)
            ->with(['usuario', 'revisor']) // usuario y revisor cargados
            ->get();

        // Separar por estado
        $pendientes  = $solicitudes->where('estado_solicitud', 1)->values();
        $aprobadas   = $solicitudes->where('estado_solicitud', 2)->values();
        $rechazadas  = $solicitudes->where('estado_solicitud', 3)->values();

        return response()->json([
            'pendientes' => $pendientes,
            'aprobadas'  => $aprobadas,
            'rechazadas' => $rechazadas,
        ]);
    }




    public function decision(Request $request, $id)
    {
        $request->validate([
            'decision' => 'required|in:2,3',
            'comentario' => 'nullable|string|max:500',
        ]);

        $solicitud = Solicitud::find($id);

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        try {
            $solicitud->estado_solicitud = (int)$request->decision;

            if ($request->comentario) {
                $solicitud->comentario = $request->comentario;
            }

            if ($request->revisor_id) {
                $solicitud->revisado_por = $request->revisor_id;
            }


            $solicitud->fecha_respuesta = now();
            $solicitud->save();

            // Cargar relación del revisor para devolverlo al frontend
            $solicitud->load('revisor');

            return response()->json($solicitud);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar la solicitud',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}

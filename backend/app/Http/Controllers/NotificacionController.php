<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    // Listar todas las notificaciones
    public function index()
    {
        $notificaciones = Notificacion::all();
        return response()->json($notificaciones);
    }

    // Mostrar una notificación específica
    public function show($id)
    {
        $notificacion = Notificacion::find($id);

        if (!$notificacion) {
            return response()->json(['error' => 'Notificación no encontrada'], 404);
        }

        return response()->json($notificacion);
    }

    // Crear una nueva notificación
    public function store(Request $request)
    {
        $request->validate([
            'id_usuario' => 'required|exists:users,id',
            'titulo' => 'required|string|max:255',
            'mensaje' => 'required|string',
            'leido' => 'boolean',
            'fecha_envio' => 'required|date',
        ]);

        $notificacion = Notificacion::create($request->all());

        return response()->json($notificacion, 201);
    }

    // Actualizar una notificación existente
    public function update(Request $request, $id)
    {
        $notificacion = Notificacion::find($id);

        if (!$notificacion) {
            return response()->json(['error' => 'Notificación no encontrada'], 404);
        }

        // Validación para leido
        $request->validate([
            'leido' => 'integer|in:1,2',
        ]);

        // Solo actualizar lo que se envía
        $notificacion->update($request->only(['leido']));

        return response()->json($notificacion);
    }


    // Eliminar una notificación
    public function destroy($id)
    {
        $notificacion = Notificacion::find($id);

        if (!$notificacion) {
            return response()->json(['error' => 'Notificación no encontrada'], 404);
        }

        $notificacion->delete();

        return response()->json(['mensaje' => 'Notificación eliminada correctamente']);
    }
}

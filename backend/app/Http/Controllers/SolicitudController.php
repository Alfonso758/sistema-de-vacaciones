<?php

namespace App\Http\Controllers;

use App\Models\Solicitud;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Usuario;
use App\Models\solicitudesVacaciones;
use App\Models\VacacionesUser;
use Illuminate\Support\Facades\Log;
use App\Notifications\SolicitudAprobada;
use App\Notifications\SolicitudRechazada;
use App\Notifications\SolicitudEditada;
use App\Notifications\NuevaSolicitud;
use App\Notifications\SolicitudCancelada;

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
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio'
        ]);

        $fechaInicio = Carbon::parse($request->fecha_inicio)->format('Y-m-d');
        $fechaFin = Carbon::parse($request->fecha_fin)->format('Y-m-d');
        $total_dias = $request->total_dias;

        // Buscar el usuario que crea la solicitud
        $usuario = Usuario::findOrFail($request->usuario_id);

        // 🔹 Verificar si el usuario ya tiene una solicitud pendiente
        $solicitudPendiente = Solicitud::where('usuario_id', $usuario->id)
            ->where('estado_solicitud', 1) // 1 = pendiente
            ->exists();

        if ($solicitudPendiente) {
            return response()->json([
                'message' => 'No es posible enviar la solicitud, tienes una solicitud pendiente.'
            ], 400);
        }

        // 🔹 Validación adicional para rol_id = 2 (jefes)
        if ($usuario->rol_id == 2) {
            $ultimaSolicitud = Solicitud::where('usuario_id', $usuario->id)
                ->where('estado_solicitud', 2) // Solo considerar solicitudes aprobadas
                ->orderBy('fecha_solicitud', 'desc')
                ->first();

            if ($ultimaSolicitud) {
                $fechaUltima = Carbon::parse($ultimaSolicitud->fecha_solicitud);

                if ($fechaUltima->greaterThanOrEqualTo(now()->subHours(72))) {
                    $horasRestantes = 72 - $fechaUltima->diffInHours(now());
                    return response()->json([
                        'message' => "No es posible enviar la solicitud. Debes esperar {$horasRestantes} horas desde tu última solicitud aprobada."
                    ], 400);
                }
            }
        }

        // Si el rol_id del usuario es 2 -> se aprueba automáticamente
        $estado = ($usuario->rol_id == 2) ? 2 : 1;

        // Crear la solicitud
        $solicitud = Solicitud::create([
            'usuario_id' => $usuario->id,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'fecha_solicitud' => now(),
            'total_dias' => $total_dias,
            'estado_solicitud' => $estado
        ]);

        // 🔹 Enviar notificación según el rol del usuario
        if ($usuario->rol_id == 1) {
            $revisor = Usuario::find($usuario->jefe_directo);
            $administradores = Usuario::where('rol_id', 3)->get(); // 3 = admin

            if ($revisor) {
                $revisor->notify(new NuevaSolicitud($usuario, $solicitud->id));
            }

            foreach ($administradores as $admin) {
                $admin->notify(new NuevaSolicitud($usuario, $solicitud->id));
            }
        } elseif ($usuario->rol_id == 2) {
            $administradores = Usuario::where('rol_id', 3)->get();

            foreach ($administradores as $admin) {
                $admin->notify(new NuevaSolicitud($usuario, $solicitud->id));
            }
        }

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
            'total_dias'   => 'required|integer|min:0',
        ]);

        // Actualizar solicitud con total_dias
        $solicitud->update($validated);

        // Usuario que editó la solicitud
        $usuario = Usuario::find($solicitud->usuario_id);

        if ($usuario) {
            // 🔹 Enviar notificación según el rol del usuario
            if ($usuario->rol_id == 1) {
                // Si es empleado → notificar a su jefe y a los administradores
                $revisor = Usuario::find($usuario->jefe_directo);
                $administradores = Usuario::where('rol_id', 3)->get(); // suponiendo que 3 = admin

                if ($revisor) {
                    $revisor->notify(new SolicitudEditada($usuario, $solicitud->id));
                }

                foreach ($administradores as $admin) {
                    $admin->notify(new SolicitudEditada($usuario, $solicitud->id));
                }
            } elseif ($usuario->rol_id == 2) {
                // Si es jefe → notificar solo a los administradores
                $administradores = Usuario::where('rol_id', 3)->get();

                foreach ($administradores as $admin) {
                    $admin->notify(new SolicitudEditada($usuario, $solicitud->id));
                }
            }
        }

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

        // Cambiar estado a cancelada (4)
        $solicitud->update(['estado_solicitud' => 4]);

        // Usuario que canceló la solicitud
        $usuario = Usuario::find($solicitud->usuario_id);

        if ($usuario) {
            // 🔹 Enviar notificación según el rol del usuario
            if ($usuario->rol_id == 1) {
                // Si es empleado → notificar a su jefe y a los administradores
                $revisor = Usuario::find($usuario->jefe_directo);
                $administradores = Usuario::where('rol_id', 3)->get(); // 3 = admin

                if ($revisor) {
                    $revisor->notify(new SolicitudCancelada($usuario, $solicitud->id));
                } else {
                    Log::warning('No se encontró jefe directo para el usuario', [
                        'usuario_id' => $usuario->id
                    ]);
                }

                foreach ($administradores as $admin) {
                    $admin->notify(new SolicitudCancelada($usuario, $solicitud->id));
                }
            } elseif ($usuario->rol_id == 2) {
                // Si es jefe → notificar solo a los administradores
                $administradores = Usuario::where('rol_id', 3)->get();

                foreach ($administradores as $admin) {
                    $admin->notify(new SolicitudCancelada($usuario, $solicitud->id));
                }
            }
        } else {
            Log::warning('No se encontró el usuario que canceló la solicitud', [
                'solicitud_id' => $solicitud->id
            ]);
        }

        return response()->json([
            'message' => 'Solicitud cancelada correctamente',
            'solicitud' => $solicitud
        ]);
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
        // 1. Obtener el rol del jefe
        $jefe = Usuario::find($jefeId);

        if (!$jefe) {
            return response()->json(['error' => 'Jefe no encontrado'], 404);
        }

        // 2. Obtener IDs de empleados según rol
        if ($jefe->rol_id == 3) {
            // rol_id 3: solo empleados (rol_id == 1)
            $empleados = Usuario::where('rol_id', 1)->pluck('id');
        } else {
            // otros jefes: solo empleados bajo su supervisión
            $empleados = Usuario::where('jefe_directo', $jefeId)->pluck('id');
        }

        // 3. Obtener solicitudes de esos empleados
        $solicitudes = solicitudesVacaciones::whereIn('usuario_id', $empleados)
            ->with(['usuario', 'revisor']) // trae info de empleado y revisor
            ->get();

        return response()->json($solicitudes);
    }

    public function solicitudesJefes($jefeId)
    {
        // 1. Verificar que el usuario sea administrador
        $jefe = Usuario::find($jefeId);

        if (!$jefe) {
            return response()->json(['error' => 'Administrador no encontrado'], 404);
        }

        if ($jefe->rol_id != 3) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // 2. Obtener IDs de usuarios que sean jefes (rol_id == 2)
        $jefes = Usuario::where('rol_id', 2)->pluck('id');

        // 3. Obtener solicitudes de esos jefes
        $solicitudes = solicitudesVacaciones::whereIn('usuario_id', $jefes)
            ->with(['usuario', 'revisor'])
            ->get()
            ->map(function ($solicitud) {
                // si está aprobada, eliminamos revisor y fecha_revision
                if ($solicitud->estado === 'aprobada') {
                    unset($solicitud->revisor);
                    unset($solicitud->fecha_revision);
                }
                return $solicitud;
            });

        return response()->json($solicitudes);
    }

    public function solicitudesReporte($jefeId)
    {
        if ($jefeId == 3) {
            // Administrador: traer todas las solicitudes con usuario, jefe y revisor
            $solicitudes = Solicitud::with(['usuario.jefe', 'revisor'])->get();
        } else {
            // Jefe: solo de sus empleados
            $empleados = Usuario::where('jefe_directo', $jefeId)->pluck('id');

            $solicitudes = Solicitud::whereIn('usuario_id', $empleados)
                ->with(['usuario.jefe', 'revisor'])
                ->get();
        }

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

            Log::info('Solicitud actualizada', [
                'id' => $solicitud->id,
                'usuario_id' => $solicitud->usuario_id,
                'estado' => $solicitud->estado_solicitud,
                'total_dias' => $solicitud->total_dias
            ]);

            // ✅ Si se aprueba
            if ($solicitud->estado_solicitud == 2) {
                $usuario = Usuario::find($solicitud->usuario_id);

                if ($usuario) {
                    // 📩 Enviar correo
                    $usuario->notify(new SolicitudAprobada());
                }

                $vacacionesUser = VacacionesUser::where('id_usuario', $solicitud->usuario_id)
                    ->orderBy('fecha_inicio_periodo', 'desc')
                    ->first();

                if ($vacacionesUser) {
                    $vacacionesUser->dias_tomados += $solicitud->total_dias;
                    $vacacionesUser->save();
                } else {
                    Log::warning('No se encontró registro de vacaciones_user', [
                        'usuario_id' => $solicitud->usuario_id
                    ]);
                }
            } else {
                $usuario = Usuario::find($solicitud->usuario_id);

                if ($usuario) {
                    // 📩 Enviar correo
                    $usuario->notify(new SolicitudRechazada());
                }
            }


            $solicitud->load('revisor');

            return response()->json($solicitud);
        } catch (\Exception $e) {
            Log::error('Error al actualizar solicitud: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al actualizar la solicitud',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function diasAcumulables()
    {
        // Traer todos los registros donde pendiente > 0
        $dias = VacacionesUser::where('pendiente', '>', 0)->get();

        return response()->json($dias);
    }
}

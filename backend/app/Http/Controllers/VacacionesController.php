<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\VacacionesUser;
use App\Models\VacacionesAnuales;
use App\Models\solicitudesVacaciones;
use Carbon\Carbon;

class VacacionesController extends Controller
{
    public function getDatos($usuarioId)
    {
        $usuario = Usuario::findOrFail($usuarioId);

        // 1. Años trabajados
        $fechaIngreso = $usuario->fecha_ingreso; // ya es Carbon por el cast
        $anosTrabajados = $fechaIngreso->diffInYears(Carbon::now());

        // 2. Días tomados y acumulados
        $vacaciones = VacacionesUser::where('id_usuario', $usuarioId)->get();

        $diasTomados = 0;
        $diasAnuales = 0;
        $diasAcumulados = 0;
        $diasDisponibles = 0;

        foreach ($vacaciones as $v) {
            $diasAnualesRegistro = $v->vacacionesAnuales->dias ?? 0;

            $diasTomados += $v->dias_tomados;
            $diasAnuales = $diasAnualesRegistro;
            $diasAcumulados += $v->dias_acumulados;

            $diasDisponibles += $diasAnuales + $diasAcumulados - $diasTomados;
            $diasAnuales += $diasAcumulados;
        }

        // 3. Fecha final del presente año
        $fechaFinAnio = Carbon::createFromDate(
            Carbon::now()->year,
            $fechaIngreso->month,
            $fechaIngreso->day
        )->format('d/m/Y');

        return response()->json([
            'fechaIngreso' => $fechaIngreso->format('d/m/Y'),
            'anosTrabajados' => $anosTrabajados,
            'diasTomados' => $diasTomados,
            'diasAnuales' => $diasAnuales,
            'diasAcumulados' => $diasAcumulados,
            'diasDisponibles' => $diasDisponibles,
            'fechaFinAnio' => $fechaFinAnio
        ]);
    }

    public function aprobadasPropias($usuario_id)
    {
        // Buscamos el usuario
        $usuario = Usuario::findOrFail($usuario_id);

        $solicitudes = solicitudesVacaciones::with('usuario')
            ->where('usuario_id', $usuario->id)
            ->where('estado_solicitud', 2)
            ->get(['usuario_id', 'fecha_inicio', 'fecha_fin']);

        // Agregamos el nombre completo de cada usuario para usar en React
        $solicitudes->transform(function ($solicitud) {
            $solicitud->nombre = $solicitud->usuario->name . ' ' . $solicitud->usuario->surnames;
            return $solicitud;
        });

        return response()->json($solicitudes);
    }

    public function aprobadas($usuario_id)
    {
        // Buscamos el usuario
        $usuario = Usuario::findOrFail($usuario_id);

        if ($usuario->rol_id == 2) {
            // Si es jefe, traemos los IDs de sus empleados
            $empleadosIds = Usuario::where('jefe_directo', $usuario->id)->pluck('id');

            // Consultamos todas las solicitudes aprobadas de sus empleados, incluyendo info del usuario
            $solicitudes = solicitudesVacaciones::with('usuario')
                ->whereIn('usuario_id', $empleadosIds)
                ->where('estado_solicitud', 2)
                ->get(['usuario_id', 'fecha_inicio', 'fecha_fin']);
        } elseif ($usuario->rol_id == 3) {
            // Si es administrador, traemos todas las solicitudes aprobadas de empleados (rol_id = 1)
            $empleadosIds = Usuario::where('rol_id', 1)->pluck('id');

            $solicitudes = solicitudesVacaciones::with('usuario')
                ->whereIn('usuario_id', $empleadosIds)
                ->where('estado_solicitud', 2)
                ->get(['usuario_id', 'fecha_inicio', 'fecha_fin']);
        } else {
            // Si no es jefe ni admin, solo traemos sus propias solicitudes aprobadas
            $solicitudes = solicitudesVacaciones::with('usuario')
                ->where('usuario_id', $usuario->id)
                ->where('estado_solicitud', 2)
                ->get(['usuario_id', 'fecha_inicio', 'fecha_fin']);
        }

        // Agregamos el nombre completo de cada usuario para usar en React
        $solicitudes->transform(function ($solicitud) {
            $solicitud->nombre = $solicitud->usuario->name . ' ' . $solicitud->usuario->surnames;
            return $solicitud;
        });

        return response()->json($solicitudes);
    }

    public function aprobadasJefes($usuario_id)
    {
        $jefesIds = Usuario::where('rol_id', 2)->pluck('id');

        $solicitudes = solicitudesVacaciones::with('usuario')
            ->whereIn('usuario_id', $jefesIds)
            ->where('estado_solicitud', 2)
            ->get(['usuario_id', 'fecha_inicio', 'fecha_fin']);

        // Agregamos el nombre completo de cada usuario para usar en React
        $solicitudes->transform(function ($solicitud) {
            $solicitud->nombre = $solicitud->usuario->name . ' ' . $solicitud->usuario->surnames;
            return $solicitud;
        });

        return response()->json($solicitudes);
    }

    public function acumular($id)
    {
        $registro = VacacionesUser::find($id);

        if (!$registro) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        // Pasar los días pendientes a dias_acumulados y poner pendiente en 0
        $registro->dias_acumulados += $registro->pendiente;
        $registro->pendiente = 0;
        $registro->save();

        return response()->json(['message' => 'Días acumulados correctamente', 'registro' => $registro]);
    }

    public function dejarPerder($id)
    {
        $registro = VacacionesUser::find($id);

        if (!$registro) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        // Dejar perder los días pendientes
        $registro->pendiente = 0;
        $registro->save();

        return response()->json(['message' => 'Días perdidos correctamente', 'registro' => $registro]);
    }
}

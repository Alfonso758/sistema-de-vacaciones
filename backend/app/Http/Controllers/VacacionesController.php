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
        } else {
            // Si no es jefe, solo traemos las suyas, con info del usuario
            $solicitudes = solicitudesVacaciones::with('usuario')
                ->where('usuario_id', $usuario->id)
                ->where('estado_solicitud', 2)
                ->get(['usuario_id', 'fecha_inicio', 'fecha_fin']);
        }

        // Agregamos el nombre completo de cada usuario para usar en React
        $solicitudes->transform(function ($solicitud) {
            $solicitud->nombre = $solicitud->usuario->name . ' ' .
                $solicitud->usuario->surnames;
            return $solicitud;
        });

        return response()->json($solicitudes);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\VacacionesUser;
use App\Models\VacacionesAnuales;
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
}

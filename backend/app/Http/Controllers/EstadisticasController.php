<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\solicitudesVacaciones;
use App\Models\VacacionesUser;

class EstadisticasController extends Controller
{
    public function mostrarPorAnio(Request $request, $anio)
    {
        try {
            $jefeId = $request->query('userID'); // ID del jefe enviado desde React

            if (!$jefeId) {
                return response()->json(['error' => 'Falta el ID del jefe'], 400);
            }

            // 🔹 Estados posibles de solicitudes
            $estadosPosibles = [
                1 => 'Pendientes',
                2 => 'Aprobadas',
                3 => 'Rechazadas'
            ];

            // Función para aplicar filtro de empleados
            $filtrarEmpleados = function($q) use ($jefeId) {
                $q->where('jefe_directo', $jefeId);
            };

            // 1️⃣ Estados de solicitudes
            $estadosRaw = solicitudesVacaciones::selectRaw('estado_solicitud as estado, COUNT(*) as value')
                ->whereYear('fecha_inicio', $anio)
                ->whereHas('usuario', $filtrarEmpleados)
                ->groupBy('estado_solicitud')
                ->get()
                ->keyBy('estado');

            $estados = [];
            foreach ($estadosPosibles as $key => $nombre) {
                $estados[] = [
                    'name' => $nombre,
                    'value' => isset($estadosRaw[$key]) ? (int)$estadosRaw[$key]->value : 0
                ];
            }

            $meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

            // 2️⃣ Solicitudes aprobadas por mes
            $aprobadasRaw = solicitudesVacaciones::selectRaw('MONTH(fecha_inicio) as mes_num, COUNT(*) as total')
                ->whereYear('fecha_inicio', $anio)
                ->where('estado_solicitud', 2)
                ->whereHas('usuario', $filtrarEmpleados)
                ->groupBy('mes_num')
                ->orderBy('mes_num')
                ->get()
                ->keyBy('mes_num');

            $aprobadasPorMes = [];
            foreach ($meses as $index => $mes) {
                $mesNum = $index + 1;
                $aprobadasPorMes[] = [
                    'mes' => $mes,
                    'total' => isset($aprobadasRaw[$mesNum]) ? (int)$aprobadasRaw[$mesNum]->total : 0
                ];
            }

            // 3️⃣ Solicitudes rechazadas por mes
            $rechazadasRaw = solicitudesVacaciones::selectRaw('MONTH(fecha_inicio) as mes_num, COUNT(*) as total')
                ->whereYear('fecha_inicio', $anio)
                ->where('estado_solicitud', 3)
                ->whereHas('usuario', $filtrarEmpleados)
                ->groupBy('mes_num')
                ->orderBy('mes_num')
                ->get()
                ->keyBy('mes_num');

            $rechazadasPorMes = [];
            foreach ($meses as $index => $mes) {
                $mesNum = $index + 1;
                $rechazadasPorMes[] = [
                    'mes' => $mes,
                    'total' => isset($rechazadasRaw[$mesNum]) ? (int)$rechazadasRaw[$mesNum]->total : 0
                ];
            }

            // 4️⃣ Uso de vacaciones
            $totalUsadas = VacacionesUser::whereHas('usuario', $filtrarEmpleados)->sum('dias_tomados');
            $totalDisponibles = VacacionesUser::whereHas('usuario', $filtrarEmpleados)->sum('dias_acumulados');

            $usoVacaciones = [
                ['name' => 'Usadas', 'value' => (int) ($totalUsadas ?? 0)],
                ['name' => 'Disponibles', 'value' => (int) ($totalDisponibles ?? 0)]
            ];

            return response()->json([
                'estados' => $estados,
                'aprobadasPorMes' => $aprobadasPorMes,
                'rechazadasPorMes' => $rechazadasPorMes,
                'usoVacaciones' => $usoVacaciones
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

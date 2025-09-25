<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\solicitudesVacaciones;
use App\Models\VacacionesUser;
use App\Models\Usuario;

class EstadisticasController extends Controller
{
    public function mostrarPorAnio(Request $request, $anio)
    {
        try {
            $userId = $request->query('userID'); // ID enviado desde React

            if (!$userId) {
                return response()->json(['error' => 'Falta el ID de usuario'], 400);
            }

            // 🔹 Obtener rol del usuario
            $usuario = Usuario::find($userId);
            if (!$usuario) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }

            // 🔹 Estados posibles de solicitudes
            $estadosPosibles = [
                1 => 'Pendientes',
                2 => 'Aprobadas',
                3 => 'Rechazadas'
            ];

            // 🔹 Función de filtrado según rol
            if ($usuario->rol_id == 2) {
                // Jefe: solo empleados a su cargo
                $filtrarEmpleados = function ($q) use ($userId) {
                    $q->where('jefe_directo', $userId);
                };
            } elseif ($usuario->rol_id == 3) {
                // Administrador: todos los usuarios con rol 1 y 2
                $filtrarEmpleados = function ($q) {
                    $q->whereIn('rol_id', [1, 2]);
                };
            } else {
                // Otro rol no tiene acceso
                return response()->json(['error' => 'No autorizado'], 403);
            }

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

            $meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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
            $totalUsadas = VacacionesUser::whereHas('usuario', $filtrarEmpleados)
                ->sum('dias_tomados');

            $totalDisponibles = VacacionesUser::whereHas('usuario', $filtrarEmpleados)
                ->join('vacaciones_anuales', 'vacaciones_user.id_dias', '=', 'vacaciones_anuales.id')
                ->sum('vacaciones_anuales.dias');

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

public function mostrarPorAnioTodas(Request $request, $anio)
{
    try {
        $userId = $request->query('userID'); // ID enviado desde React
        if (!$userId) {
            return response()->json(['error' => 'Falta el ID de usuario'], 400);
        }

        $usuario = Usuario::find($userId);
        if (!$usuario) return response()->json(['error' => 'Usuario no encontrado'], 404);

        // Solo administradores (rol_id = 3)
        if ((int)$usuario->rol_id !== 3) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $estadosPosibles = [
            1 => 'Pendientes',
            2 => 'Aprobadas',
            3 => 'Rechazadas'
        ];

        $meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

        // 🔹 Función para calcular estadísticas por rol
        $calcularStats = function($rolFiltro = null) use ($anio, $estadosPosibles, $meses) {
            $queryUsuarios = Usuario::query();
            if ($rolFiltro) $queryUsuarios->where('rol_id', $rolFiltro);

            // Estados
            $estadosRaw = solicitudesVacaciones::selectRaw('estado_solicitud as estado, COUNT(*) as value')
                ->whereYear('fecha_inicio', $anio)
                ->whereHas('usuario', function($q) use ($queryUsuarios) {
                    $q->whereIn('id', $queryUsuarios->pluck('id'));
                })
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

            // Aprobadas por mes
            $aprobadasRaw = solicitudesVacaciones::selectRaw('MONTH(fecha_inicio) as mes_num, COUNT(*) as total')
                ->whereYear('fecha_inicio', $anio)
                ->where('estado_solicitud', 2)
                ->whereHas('usuario', function($q) use ($queryUsuarios) {
                    $q->whereIn('id', $queryUsuarios->pluck('id'));
                })
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

            // Rechazadas por mes
            $rechazadasRaw = solicitudesVacaciones::selectRaw('MONTH(fecha_inicio) as mes_num, COUNT(*) as total')
                ->whereYear('fecha_inicio', $anio)
                ->where('estado_solicitud', 3)
                ->whereHas('usuario', function($q) use ($queryUsuarios) {
                    $q->whereIn('id', $queryUsuarios->pluck('id'));
                })
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

            // Uso de vacaciones
            $totalUsadas = VacacionesUser::whereHas('usuario', function($q) use ($queryUsuarios) {
                $q->whereIn('id', $queryUsuarios->pluck('id'));
            })->sum('dias_tomados');

            $totalDisponibles = VacacionesUser::whereHas('usuario', function($q) use ($queryUsuarios) {
                $q->whereIn('id', $queryUsuarios->pluck('id'));
            })
            ->join('vacaciones_anuales', 'vacaciones_user.id_dias', '=', 'vacaciones_anuales.id')
            ->sum('vacaciones_anuales.dias');

            $usoVacaciones = [
                ['name' => 'Usadas', 'value' => (int)($totalUsadas ?? 0)],
                ['name' => 'Disponibles', 'value' => (int)($totalDisponibles ?? 0)]
            ];

            return [
                'estados' => $estados,
                'aprobadasPorMes' => $aprobadasPorMes,
                'rechazadasPorMes' => $rechazadasPorMes,
                'usoVacaciones' => $usoVacaciones
            ];
        };

        // 🔹 Generar estadísticas separadas
        $datos = [
            'todos' => $calcularStats(),        // todos los usuarios
            'empleados' => $calcularStats(1),   // solo empleados
            'jefes' => $calcularStats(2)        // solo jefes
        ];

        return response()->json($datos);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

}

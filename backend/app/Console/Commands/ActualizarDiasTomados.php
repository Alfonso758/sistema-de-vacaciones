<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActualizarDiasTomados extends Command
{
    protected $signature = 'vacaciones:actualizar-dias';
    protected $description = 'Suma los días tomados después de 72 horas de solicitudes aprobadas por jefes de área.';

    public function handle()
    {
        $ahora = Carbon::now();
        $limite = $ahora->copy()->subHours(71); // solicitudes con 71h o más

        // Buscar solicitudes aprobadas, no procesadas y con más de 71h
        $solicitudes = DB::table('solicitudes_vacaciones')
            ->join('users', 'solicitudes_vacaciones.usuario_id', '=', 'users.id')
            ->where('solicitudes_vacaciones.estado_solicitud', 2)
            ->where('users.rol_id', 2)
            ->where(function ($q) {
                $q->where('solicitudes_vacaciones.procesada', 0)
                    ->orWhereNull('solicitudes_vacaciones.procesada');
            })
            ->where('solicitudes_vacaciones.fecha_solicitud', '<=', $limite)
            ->select(
                'solicitudes_vacaciones.id',
                'solicitudes_vacaciones.usuario_id',
                'solicitudes_vacaciones.total_dias'
            )
            ->get();

        $contador = 0;

        foreach ($solicitudes as $solicitud) {
            // Buscar el último registro del usuario en vacaciones_user
            $vacacion = DB::table('vacaciones_user')
                ->where('id_usuario', $solicitud->usuario_id)
                ->orderByDesc('id')
                ->first();

            if ($vacacion) {
                $nuevoValor = $vacacion->dias_tomados + $solicitud->total_dias;

                DB::table('vacaciones_user')
                    ->where('id', $vacacion->id)
                    ->update(['dias_tomados' => $nuevoValor]);

                // Marcar la solicitud como procesada
                DB::table('solicitudes_vacaciones')
                    ->where('id', $solicitud->id)
                    ->update(['procesada' => 1]);

                $contador++;
            }
        }

        $this->info("✅ Se actualizaron {$contador} solicitudes correctamente.");
    }
}

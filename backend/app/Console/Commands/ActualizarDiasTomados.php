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
        $limite = $ahora->subHours(72);

        // Buscar solicitudes aprobadas (estado_solicitud = 2) de jefes de área (rol_id = 2)
        $solicitudes = DB::table('solicitudes_vacaciones')
            ->join('users', 'solicitudes_vacaciones.id_usuario', '=', 'users.id')
            ->where('solicitudes_vacaciones.estado_solicitud', 2)
            ->where('users.rol_id', 2)
            ->where('solicitudes_vacaciones.fecha_solicitud', '<=', $limite)
            ->select('solicitudes_vacaciones.id_usuario', 'solicitudes_vacaciones.total_dias')
            ->get();

        $contador = 0;

        foreach ($solicitudes as $solicitud) {
            // Buscar el último registro del usuario en vacaciones_user
            $vacacion = DB::table('vacaciones_user')
                ->where('id_usuario', $solicitud->id_usuario)
                ->orderByDesc('id')
                ->first();

            if ($vacacion) {
                $nuevoValor = $vacacion->dias_tomados + $solicitud->total_dias;

                DB::table('vacaciones_user')
                    ->where('id', $vacacion->id)
                    ->update(['dias_tomados' => $nuevoValor]);

                $contador++;
            }
        }

        $this->info("✅ Se actualizaron {$contador} registros correctamente.");
    }
}

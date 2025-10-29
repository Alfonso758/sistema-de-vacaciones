<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LimpiarPendientes extends Command
{
    protected $signature = 'vacaciones:limpiar-pendientes';
    protected $description = 'Limpia los valores pendientes (>0) después de 72 horas en la tabla vacaciones_user.';

    public function handle()
    {
        $ahora = Carbon::now();
        $limite = $ahora->subHours(72);

        // Selecciona registros con pendiente > 0 y más de 72 horas
        $registros = DB::table('vacaciones_user')
            ->where('pendiente', '>', 0)
            ->where('created_at', '<=', $limite)
            ->get();

        $contador = 0;

        foreach ($registros as $r) {
            DB::table('vacaciones_user')
                ->where('id', $r->id)
                ->update(['pendiente' => 0]);

            $contador++;
        }

        $this->info("✅ Se limpiaron {$contador} registros pendientes.");
    }
}

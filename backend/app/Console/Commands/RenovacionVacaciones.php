<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Usuario;
use App\Models\VacacionesAnuales;
use App\Models\VacacionesUser;
use App\Notifications\DiasAcumulables;
use Carbon\Carbon;

class RenovacionVacaciones extends Command
{
    protected $signature = 'vacaciones:renovar';
    protected $description = 'Renueva automáticamente los días de vacaciones al cumplir un año más en la empresa';

    public function handle()
    {
        $hoy = Carbon::today();
        $usuarios = Usuario::all();

        foreach ($usuarios as $usuario) {
            $fechaIngreso = Carbon::parse($usuario->fecha_ingreso);
            $aniosTrabajados = $fechaIngreso->diffInYears($hoy);

            // ✅ Si hoy cumple aniversario
            if ($fechaIngreso->isSameDay($hoy->copy()->subYears($aniosTrabajados)) && $aniosTrabajados > 0) {

                // 1️⃣ Buscar rango de días de vacaciones según años trabajados
                $vacacionesAnuales = VacacionesAnuales::where('anio_inicio', '<=', $aniosTrabajados)
                    ->where('anio_fin', '>=', $aniosTrabajados)
                    ->first();

                if (!$vacacionesAnuales) {
                    $this->warn("No se encontró rango de vacaciones para {$usuario->name}");
                    continue;
                }

                $diasOtorgados = $vacacionesAnuales->dias;

                // 2️⃣ Calcular días pendientes del último registro (si existe)
                $ultimoRegistro = VacacionesUser::where('id_usuario', $usuario->id)
                    ->latest('fecha_fin_periodo')
                    ->first();

                $pendiente = 0;
                if ($ultimoRegistro) {
                    $pendiente = ($ultimoRegistro->dias_otorgados + $ultimoRegistro->dias_acumulados) - $ultimoRegistro->dias_tomados;
                }

                // 3️⃣ Crear nuevo periodo de vacaciones
                $nuevoPeriodo = new VacacionesUser();
                $nuevoPeriodo->id_usuario = $usuario->id;
                $nuevoPeriodo->fecha_inicio_periodo = $hoy;
                $nuevoPeriodo->fecha_fin_periodo = $hoy->copy()->addYear()->subDay();
                $nuevoPeriodo->id_dias = $vacacionesAnuales->id;
                $nuevoPeriodo->dias_otorgados = $diasOtorgados;
                $nuevoPeriodo->dias_acumulados = 0;
                $nuevoPeriodo->dias_tomados = 0;
                $nuevoPeriodo->pendiente = $pendiente;
                $nuevoPeriodo->save();

                $this->info("Vacaciones renovadas para {$usuario->name}: {$diasOtorgados} días (pendiente: {$pendiente}).");

                // 4️⃣ Si hay días pendientes, notificar a todos los administradores
                if ($pendiente > 0) {
                    $administradores = Usuario::where('rol_id', 3)->get(); // 3 = admin

                    foreach ($administradores as $admin) {
                        $admin->notify(new DiasAcumulables($usuario));
                    }

                    $this->info("Notificación enviada a administradores por días pendientes de {$usuario->name}.");
                }
            }
        }

        $this->info('Proceso de renovación de vacaciones completado.');
    }
}

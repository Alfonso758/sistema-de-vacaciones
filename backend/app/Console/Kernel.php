<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Comando 1: sumar días tomados después de 72h
        $schedule->command('vacaciones:actualizar-dias')->hourly();

        // Comando 2: limpiar pendientes después de 72h
        $schedule->command('vacaciones:limpiar-pendientes')->hourly();

        // (Tu comando existente)
        $schedule->command('vacaciones:renovar')->dailyAt('00:05');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}

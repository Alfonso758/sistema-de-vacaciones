<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class AcumularDias extends Notification
{
    protected $usuario;

    public function __construct($usuario)
    {
        $this->usuario = $usuario;
    }

    public function via($notifiable)
    {
        // Registrar notificación interna
        Notificacion::create([
            'id_usuario'  => $notifiable->id,
            'titulo'      => 'Días de vacaciones acumulados',
            'mensaje'     => 'Un administrador acumuló tus días de vacaciones vencidos para este periodo. Ingresa al sistema para más información.',
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Días de vacaciones acumulados')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Un administrador ha acumulado tus días de vacaciones vencidos.')
            ->line('Te invitamos a ingresar al sistema para revisar los detalles y tu nuevo saldo de días disponibles.')
            ->action('Ver en el sistema', url('/vacaciones'))
            ->line('Disfruta tus vacaciones.');
    }
}

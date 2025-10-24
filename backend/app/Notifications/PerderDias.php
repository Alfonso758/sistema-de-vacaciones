<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class PerderDias extends Notification
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
            'titulo'      => 'Días de vacaciones perdidos',
            'mensaje'     => 'Tus días de vacaciones vencidos no fueron acumulados y se han perdido.',
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Días de vacaciones perdidos')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Tus días de vacaciones vencidos no fueron acumulados y se han perdido.');
    }
}

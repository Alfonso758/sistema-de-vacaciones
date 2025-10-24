<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class SolicitudAprobada extends Notification
{
    public function via($notifiable)
    {
        // Registrar la notificación interna en la base de datos
        Notificacion::create([
            'id_usuario'  => $notifiable->id,
            'titulo'      => 'Solicitud de vacaciones aprobada',
            'mensaje'     => 'Tu solicitud de vacaciones ha sido aprobada.',
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Tu solicitud de vacaciones ha sido aprobada')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Nos complace informarte que tu solicitud de vacaciones ha sido aprobada.')
            ->line('Puedes consultar los detalles y el estado en el sistema.')
            ->action('Ver solicitud', 'https://vacaciones.sokodev.com')
            ->line('Gracias por utilizar el sistema de gestión de vacaciones de Sokolabs.');
    }
}

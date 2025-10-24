<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class SolicitudRechazada extends Notification
{
    public function via($notifiable)
    {
        // Registrar la notificación interna en la base de datos
        Notificacion::create([
            'id_usuario'  => $notifiable->id,
            'titulo'      => 'Solicitud de vacaciones rechazada',
            'mensaje'     => 'Tu solicitud de vacaciones ha sido rechazada.',
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Tu solicitud de vacaciones ha sido rechazada')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Lamentamos informarte que tu solicitud de vacaciones ha sido rechazada.')
            ->line('Puedes revisar los detalles en el sistema.')
            ->action('Ver solicitud', 'https://vacaciones.sokodev.com')
            ->line('Si tienes dudas, por favor contacta con el revisor de la solicitud.');
    }
}

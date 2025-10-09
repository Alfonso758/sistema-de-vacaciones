<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class Contraseña extends Notification
{
    public function via($notifiable)
    {
        // Registramos la notificación en la DB
        Notificacion::create([
            'id_usuario' => $notifiable->id,
            'titulo'     => 'Contraseña de acceso manual',
            'mensaje'    => 'Tu contraseña de acceso es: Soko2025* Te sugerimos cambiarla después de recibir este mensaje.',
            'leido'      => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Contraseña de acceso manual')
            ->greeting('Hola ' . $notifiable->name)
            ->line('Tu contraseña de acceso es: Soko2025*')
            ->line('Te sugerimos cambiarla después de recibir este mensaje.')
            ->with([
                'html' => true
            ]);
    }
}

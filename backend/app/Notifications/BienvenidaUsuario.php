<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class BienvenidaUsuario extends Notification
{
    public function via($notifiable)
    {
        // Registramos la notificación en la DB
        Notificacion::create([
            'id_usuario' => $notifiable->id,
            'titulo'     => 'Bienvenido al sistema de vacaciones Sokolabs',
            'mensaje'    => 'Tu cuenta ha sido creada en el sistema de vacaciones de Sokolabs. Gracias por unirte a nosotros.',
            'leido'      => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail']; // además de registrar, enviamos correo
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Bienvenido al sistema de vacaciones Sokolabs')
            ->greeting('Hola ' . $notifiable->name)
            ->line('Tu cuenta ha sido creada en el sistema de vacaciones de Sokolabs.')
            ->action('Iniciar sesión', 'http://localhost:5173/LoginForm')
            ->line('Gracias por unirte a nosotros.');
    }
}

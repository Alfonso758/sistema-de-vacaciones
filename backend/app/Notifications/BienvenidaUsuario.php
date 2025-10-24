<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class BienvenidaUsuario extends Notification
{
    public function via($notifiable)
    {
        Notificacion::create([
            'id_usuario'  => $notifiable->id,
            'titulo'      => 'Acceso habilitado al sistema de vacaciones',
            'mensaje'     => 'Te damos la más cordial bienvenida al sistema de gestión vacacional de Sokolabs.',
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail']; 
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Tu acceso al sistema de vacaciones Sokolabs ha sido habilitado')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Nos complace informarte que tu cuenta ha sido habilitada para acceder al sistema interno de gestión vacacional de Sokolabs.')
            ->line('Ahora puedes iniciar sesion y acceder al sistema de manera segura')
            ->action('Acceder al sistema', 'https://vacaciones.sokodev.com')
            ->line('Recuerda que este sistema es de uso exclusivo para colaboradores de Sokolabs.');
    }
}

<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class BienvenidaUsuario extends Notification
{
    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Bienvenido al sistema de vacaciones Sokolabs')
            ->greeting('Hola '.$notifiable->name)
            ->line('Tu cuenta ha sido creada correctamente en el sistema de vacaciones de Sokolabs.')
            ->action('Iniciar sesión', 'http://localhost:5173/LoginForm')
            ->line('Gracias por unirte a nosotros.');
    }
}

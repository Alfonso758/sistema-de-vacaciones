<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class CuentaNueva extends Notification
{
    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Tu cuenta ha sido creada - Pendiente de activación')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line('Hemos creado tu cuenta en el sistema de gestión vacacional de Sokolabs.')
            ->line('Por motivos de seguridad, tu cuenta aún no está activa. Un administrador la revisará y la activará en breve.')
            ->line('Recibirás otra notificación tan pronto como tu cuenta esté lista para usar.')
            ->line('Gracias por tu paciencia y bienvenido(a) a Sokolabs.');
    }
}

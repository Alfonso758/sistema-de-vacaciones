<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class VacacionesAprobadas extends Notification
{
    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Vacaciones aprobadas')
            ->greeting('Hola '.$notifiable->name)
            ->line('Tus vacaciones han sido aprobadas.')
            ->action('Ver en el sistema', url('/vacaciones'))
            ->line('Gracias por usar nuestro sistema de vacaciones.');
    }
}

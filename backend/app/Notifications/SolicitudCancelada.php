<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class SolicitudCancelada extends Notification
{
    protected $usuario;
    protected $solicitudId;

    public function __construct($usuario, $solicitudId)
    {
        $this->usuario = $usuario;
        $this->solicitudId = $solicitudId;
    }

    public function via($notifiable)
    {
        // Registrar la notificación interna en la base de datos
        Notificacion::create([
            'id_usuario'  => $notifiable->id,
            'titulo'      => 'Solicitud de vacaciones cancelada',
            'mensaje'     => "El usuario {$this->usuario->name} ha cancelado su solicitud de vacaciones.",
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Solicitud de vacaciones cancelada')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line("El usuario {$this->usuario->name} {$this->usuario->surnames} ha cancelado su solicitud de vacaciones.")
            ->line('El registro ya se actualizó en el sistema.')
            ->line('Para más información puedes contactarte con este usuario.');
    }
}

<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class SolicitudEditada extends Notification
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
            'titulo'      => 'Solicitud de vacaciones editada',
            'mensaje'     => "El usuario {$this->usuario->name} ha editado su solicitud de vacaciones.",
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Solicitud de vacaciones editada')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line("El usuario {$this->usuario->name} ha realizado cambios en su solicitud de vacaciones.")
            ->line('Por favor revisa la solicitud actualizada y toma las acciones necesarias.')
            ->action('Ver solicitud', 'https://vacaciones.sokodev.com')
            ->line('Gracias por mantener el seguimiento de las solicitudes de tus empleados.');
    }
}

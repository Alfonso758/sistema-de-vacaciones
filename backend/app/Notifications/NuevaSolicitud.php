<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class NuevaSolicitud extends Notification
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
            'titulo'      => 'Nueva solicitud de vacaciones',
            'mensaje'     => "El usuario {$this->usuario->name} ha realizado una nueva solicitud de vacaciones.",
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Nueva solicitud de vacaciones')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line("El usuario {$this->usuario->name} ha creado una nueva solicitud de vacaciones.")
            ->line('Por favor revisa la solicitud y procede con la aprobación o rechazo correspondiente.')
            ->action('Ver solicitud', 'https://vacaciones.sokodev.com')
            ->line('Gracias por dar seguimiento a las solicitudes de tus empleados.');
    }
}

<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Notificacion;

class DiasAcumulables extends Notification
{
    protected $usuario;

    public function __construct($usuario)
    {
        $this->usuario = $usuario;
    }

    public function via($notifiable)
    {
        // Guardar también la notificación interna en la base de datos
        Notificacion::create([
            'id_usuario'  => $notifiable->id,
            'titulo'      => 'Días vencidos por revisar',
            'mensaje'     => "{$this->usuario->name} tiene días de vacaciones vencidos del periodo anterior. Revisa si se acumularán o se perderán.",
            'leido'       => 2,
            'fecha_envio' => now(),
        ]);

        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Días vencidos por revisar')
            ->greeting('Hola ' . $notifiable->name . ',')
            ->line("{$this->usuario->name} tiene días de vacaciones vencidos del periodo anterior.")
            ->line('Por favor revisa y decide si los días se acumularán o se perderán.')
            ->action('Revisar en el sistema', 'https://vacaciones.sokodev.com')
            ->line('Gracias por mantener actualizado el control de vacaciones.');
    }
}

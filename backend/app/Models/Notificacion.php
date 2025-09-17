<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notificacion extends Model
{
    use HasFactory;

    protected $table = 'notificaciones';

    // Columnas que se pueden asignar masivamente
    protected $fillable = [
        'id_usuario',
        'titulo',
        'mensaje',
        'leido',
        'fecha_envio',
    ];

    // Si quieres usar timestamps automáticos (created_at, updated_at)
    public $timestamps = true;

    // Relación con usuarios (opcional)
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}

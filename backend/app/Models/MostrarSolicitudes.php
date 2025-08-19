<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MostrarSolicitudes extends Model
{
    use HasFactory;

    // Nombre de la tabla en tu BD
    protected $table = 'solicitudes_vacaciones';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'usuario_id',
        'fecha_inicio',
        'fecha_fin',
        'estado_solicitud',
        'comentario',
        'revisado_por',
        'fecha_respuesta',
    ];

    // Si no usas timestamps automáticos, desactívalos
    public $timestamps = true;
}

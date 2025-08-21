<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class MostrarSolicitudes extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_vacaciones';

    protected $fillable = [
        'usuario_id',
        'fecha_inicio',
        'fecha_fin',
        'estado_solicitud',
        'comentario',
        'revisado_por',
        'fecha_respuesta',
    ];

    public $timestamps = true;

    // Relación con el usuario que solicitó vacaciones
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    // Relación con el usuario que revisó la solicitud
    public function revisor()
    {
        return $this->belongsTo(Usuario::class, 'revisado_por');
    }
}

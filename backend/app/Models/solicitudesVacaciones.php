<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class solicitudesVacaciones extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_vacaciones';

    protected $fillable = [
        'usuario_id',
        'fecha_inicio',
        'fecha_fin',
        'fecha_solicitud',
        'estado_solicitud',
        'comentario',
        'fecha_respuesta',
        'revisado_por',
    ];

    // Relación con usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    // Relación con revisor (otro usuario)
    public function revisor()
    {
        return $this->belongsTo(Usuario::class, 'revisado_por');
    }
}

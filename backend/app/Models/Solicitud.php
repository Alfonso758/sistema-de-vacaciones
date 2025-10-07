<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Solicitud extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_vacaciones';

    // Atributos que se pueden llenar masivamente
    protected $fillable = [
        'usuario_id',
        'fecha_inicio',
        'fecha_fin',
        'fecha_solicitud',
        'total_dias', 
        'estado_solicitud',
        'comentario',
        'revisado_por',
        'fecha_respuesta',
    ];

    // Si quieres usar timestamps (created_at, updated_at)
    public $timestamps = true;

    /**
     * Relación con el usuario que solicitó la vacación
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Relación con el usuario que revisó la solicitud
     */
    public function revisor()
    {
        return $this->belongsTo(Usuario::class, 'revisado_por');
    }
}

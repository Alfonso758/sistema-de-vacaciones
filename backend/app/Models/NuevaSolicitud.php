<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NuevaSolicitud extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_vacaciones';
    protected $fillable = [
        'usuario_id',
        'fecha_inicio',
        'fecha_fin',
        'fecha_solicitud',
        'estado_solicitud',
    ];

    // Si tu tabla no tiene created_at / updated_at
    public $timestamps = false;
}

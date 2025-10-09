<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VacacionesUser extends Model
{
    use HasFactory;

    protected $table = 'vacaciones_user';
    protected $fillable = [
        'id_usuario',
        'fecha_inicio_periodo',
        'fecha_fin_periodo',
        'id_dias',
        'dias_otorgados',
        'dias_acumulados',
        'dias_tomados',
        'pendiente'
    ];

    // Relación con el usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }

    // Relación con los días anuales
    public function vacacionesAnuales()
    {
        return $this->belongsTo(VacacionesAnuales::class, 'id_dias');
    }

    /**
     * Calcular días disponibles totales
     */
    public function calcularDiasDisponibles()
    {
        $diasAnuales = $this->vacacionesAnuales->dias ?? 0;
        return $diasAnuales + $this->dias_acumulados - $this->dias_tomados;
    }
}

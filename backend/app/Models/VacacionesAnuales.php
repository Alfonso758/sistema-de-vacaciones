<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VacacionesAnuales extends Model
{
    use HasFactory;

    protected $table = 'vacaciones_anuales';
    protected $fillable = [
        'dias'
    ];

    // Relación inversa con VacacionesUser
    public function vacacionesUser()
    {
        return $this->hasMany(VacacionesUser::class, 'id_dias');
    }
}

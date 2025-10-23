<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiaInhabil extends Model
{
    use HasFactory;

    protected $table = 'dias_inhabiles';

    protected $fillable = [
        'nombre',
        'fecha',
        'siempre',
    ];

    public $timestamps = false;

    /**
     * Verifica si el día inhábil aplica para cualquier año
     */
    public function esSiempre(): bool
    {
        return $this->siempre == 1;
    }
}

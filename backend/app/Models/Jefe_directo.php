<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Jefe_directo extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    protected $table = 'users';

    /** Relación: este usuario pertenece a un jefe (self reference) */
    public function jefe()
    {
        return $this->belongsTo(Jefe_directo::class, 'jefe_directo');
    }

    public function subalternos()
    {
        return $this->hasMany(Jefe_directo::class, 'jefe_directo');
    }

    public function scopeJefes($query)
    {
        return $query->where('rol_id', 2);
    }
}
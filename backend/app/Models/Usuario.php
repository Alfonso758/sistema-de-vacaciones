<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'surnames', // ✅ Igual que en la BD
        'email',
        'password',
        'rol_id',
        'activo',
        'email_verified_at',
    ];


    protected $hidden = [
        'password',
        'remember_token',
    ];
}

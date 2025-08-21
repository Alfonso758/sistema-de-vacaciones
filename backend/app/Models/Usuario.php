<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';

    /**
     * Atributos asignables masivamente
     */
    protected $fillable = [
        'name',
        'surnames',        // Igual que en la BD
        'email',
        'password',
        'rol_id',
        'activo',
        'fecha_ingreso',   // Nuevo
        'jefe_directo',    // Nuevo
        'email_verified_at',
    ];

    /**
     * Atributos ocultos para serialización
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casting de atributos
     */
    protected $casts = [
        'activo' => 'boolean',
        'fecha_ingreso' => 'date',
        'email_verified_at' => 'datetime',
    ];

    /** Relación: este usuario pertenece a un jefe (self reference) */
    public function jefe()
    {
        return $this->belongsTo(Usuario::class, 'jefe_directo');
    }

    /** Relación: este usuario tiene subalternos (self reference) */
    public function subalternos()
    {
        return $this->hasMany(Usuario::class, 'jefe_directo');
    }

    /** Scope para filtrar solo jefes (rol_id = 2) */
    public function scopeJefes($query)
    {
        return $query->where('rol_id', 2);
    }
}

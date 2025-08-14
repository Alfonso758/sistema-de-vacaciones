<?php

namespace App\Models;

// database/migrations/xxxx_xx_xx_create_solicitudes_vacaciones_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSolicitudesVacacionesTable extends Migration
{
    public function up()
    {
        Schema::create('solicitudes_vacaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->date('fecha_solicitud');
            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada', 'cancelada'])->default('pendiente');
            $table->text('comentarios_admin')->nullable();
            $table->date('fecha_respuesta')->nullable();
            $table->foreignId('revisado_por')->nullable()->constrained('usuarios');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('solicitudes_vacaciones');
    }
}

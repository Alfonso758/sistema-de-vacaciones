<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
// database/migrations/xxxx_xx_xx_create_notificaciones_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificacionesTable extends Migration
{
    public function up()
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios');
            $table->text('mensaje');
            $table->string('tipo');
            $table->boolean('leido')->default(false);
            $table->timestamp('fecha_envio');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('notificaciones');
    }
}

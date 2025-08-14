<?php

namespace App\Models;

// database/migrations/xxxx_xx_xx_create_criterios_vacaciones_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCriteriosVacacionesTable extends Migration
{
    public function up()
    {
        Schema::create('criterios_vacaciones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['fijo', 'configurable']);
            $table->integer('valor')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('criterios_vacaciones');
    }
}

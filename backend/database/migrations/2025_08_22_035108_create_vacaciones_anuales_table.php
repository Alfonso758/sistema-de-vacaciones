<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vacaciones_anuales', function (Blueprint $table) {
            $table->id();                 // id autoincremental
            $table->integer('dias');      // cantidad de días
            $table->integer('anios');     // años (antigüedad)
            $table->timestamps();         // created_at y updated_at
        });
    }

    public function down()
    {
        Schema::dropIfExists('vacaciones_anuales');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vacaciones_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_usuario')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_dias')->constrained('vacaciones_anuales')->onDelete('cascade');
            $table->integer('dias_acumulados');
            $table->integer('dias_tomados');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('vacaciones_user');
    }
};

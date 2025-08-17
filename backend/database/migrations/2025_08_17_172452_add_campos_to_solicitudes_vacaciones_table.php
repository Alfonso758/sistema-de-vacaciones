<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('solicitudes_vacaciones', function (Blueprint $table) {
            $table->unsignedBigInteger('usuario_id')->after('id');
            $table->date('fecha_inicio')->after('usuario_id');
            $table->date('fecha_fin')->after('fecha_inicio');
            $table->date('fecha_solicitud')->after('fecha_fin');
            $table->string('estado')->after('fecha_solicitud');
            $table->text('comentario')->nullable()->after('estado');
            $table->date('fecha_respuesta')->nullable()->after('comentario');
            $table->unsignedBigInteger('revisado_por')->nullable()->after('fecha_respuesta');

            // Llaves foráneas
            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('revisado_por')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('solicitudes_vacaciones', function (Blueprint $table) {
            $table->dropForeign(['usuario_id']);
            $table->dropForeign(['revisado_por']);
            $table->dropColumn(['usuario_id', 'fecha_inicio', 'fecha_fin', 'fecha_solicitud', 'estado', 'comentario', 'fecha', 'respuesta', 'revisado_por']);
        });
    }
};

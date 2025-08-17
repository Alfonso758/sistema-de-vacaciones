<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddForeignKeyRolIdToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Asegúrate que la columna exista, si no existe créala
            if (!Schema::hasColumn('users', 'rol_id')) {
                $table->unsignedBigInteger('rol_id')->after('id');
            }

            // Crear la relación foránea
            $table->foreign('rol_id')
                ->references('id')
                ->on('roles')
                ->onDelete('cascade'); // si borras un rol, borra también sus usuarios
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Primero elimina la relación
            $table->dropForeign(['rol_id']);
            // Y luego elimina la columna si quieres
            $table->dropColumn('rol_id');
        });
    }
}

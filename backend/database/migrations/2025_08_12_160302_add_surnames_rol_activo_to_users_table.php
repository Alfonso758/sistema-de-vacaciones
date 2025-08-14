<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('surnames')->after('name');
            $table->unsignedBigInteger('rol_id')->after('password');
            $table->boolean('activo')->default(true)->after('rol_id');
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['surnames', 'rol_id', 'activo']);
        });
    }
};

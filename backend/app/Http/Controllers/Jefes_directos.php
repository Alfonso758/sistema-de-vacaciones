<?php

namespace App\Http\Controllers;

use App\Models\Jefe_directo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class Jefes_directos extends Controller
{
    // 🔹 Obtener todos los jefes (rol_id = 2)
    public function getJefes()
    {
        $jefes = Jefe_directo::where('rol_id', 2)
            ->select('id', 'name', 'surnames')
            ->get();

        return response()->json($jefes);
    }
}

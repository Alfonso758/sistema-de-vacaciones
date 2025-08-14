<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;

use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json(['message' => 'Correo o contraseña incorrecta'], 401);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id'       => $usuario->id,
                'nombre'   => $usuario->name,
                'apellidos'   => $usuario->surnames,
                'rol_id'   => $usuario->rol_id,
                'email'    => $usuario->email,
            ],
            'token' => $token
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'surnames'  => 'required|string|max:255', // ✅ Igual que en la BD
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $usuario = Usuario::create([
            'name'      => $request->name,
            'surnames'  => $request->surnames, // ✅ Igual que en la BD
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'rol_id'    => 0,
            'activo'    => 1,
            'email_verified_at' => now(),
        ]);


        return response()->json([
            'message' => 'Usuario registrado correctamente',
            'user'    => $usuario
        ]);
    }
}

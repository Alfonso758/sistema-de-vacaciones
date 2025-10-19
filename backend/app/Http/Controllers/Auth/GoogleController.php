<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Google\Client;
use App\Models\Usuario;

class GoogleController extends Controller
{
    public function login(Request $request)
    {
        try {
            $token = $request->input('token');

            if (!$token) {
                return response()->json([
                    'error' => 'Error al iniciar sesión con Google',
                    'detalle' => 'Token no proporcionado'
                ], 400);
            }

            $client = new Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($token);

            if (!$payload) {
                return response()->json([
                    'error' => 'Error al iniciar sesión con Google',
                    'detalle' => 'Token inválido'
                ], 401);
            }

            $email = $payload['email'];

            // Buscar usuario existente
            $user = Usuario::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'error' => 'Error al iniciar sesión con Google',
                    'detalle' => 'Correo no registrado'
                ], 403);
            }

            if (!$user->activo) {
                return response()->json([
                    'error' => 'Error al iniciar sesión con Google',
                    'detalle' => 'La cuenta está inactiva'
                ], 403);
            }

            // Crear token Sanctum
            $appToken = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'user' => [
                    'usuarioID' => $user->id,
                    'nombre' => $user->name,
                    'apellidos' => $user->surnames,
                    'rol_id' => $user->rol_id,
                    'email' => $user->email,
                    'avatarUrl' => $user->avatar ? 'storage/' . $user->avatar : null,
                    'jefe_directo' => $user->jefe_directo,
                    'activo' => $user->activo,
                    'fecha_ingreso' => $user->fecha_ingreso,
                ],
                'token' => $appToken
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al iniciar sesión con Google',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}

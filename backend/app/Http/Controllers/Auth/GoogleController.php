<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Google\Client;
use App\Models\Usuario;
use Illuminate\Support\Str;
use App\Notifications\BienvenidaUsuario;
use App\Notifications\contraseña;

class GoogleController extends Controller
{
    public function login(Request $request)
    {
        try {
            $token = $request->input('token');
            if (!$token) {
                return response()->json(['error' => 'Token no proporcionado'], 400);
            }

            $client = new Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($token);

            if (!$payload) {
                return response()->json(['error' => 'Token inválido'], 401);
            }

            $email = $payload['email'];
            $name = $payload['name'] ?? $email;

            // Crear o recuperar usuario
            $user = Usuario::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'surnames' => '',
                    'password' => bcrypt('Soko2025*'),
                    'rol_id' => 5,
                    'activo' => true,
                    'email_verified_at' => now(),
                ]
            );

            // 📩 Enviar correo de bienvenida solo si es un usuario nuevo
            if ($user->wasRecentlyCreated) {
                $user->notify(new BienvenidaUsuario($user));
                $user->notify(new contraseña($user));
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
            return response()->json(['error' => 'Error en el servidor', 'detalle' => $e->getMessage()], 500);
        }
    }
}

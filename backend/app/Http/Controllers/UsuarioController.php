<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;

class UsuarioController extends Controller
{
    // 🔹 Login
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
                'usuarioID' => $usuario->id,
                'nombre'    => $usuario->name,
                'apellidos' => $usuario->surnames,
                'rol_id'    => $usuario->rol_id,
                'email'     => $usuario->email,
                'jefe_directo' => $usuario->jefe_directo,
                'activo'    => $usuario->activo,
                'fecha_ingreso' => $usuario->fecha_ingreso,
            ],
            'token' => $token
        ]);
    }

    // 🔹 Obtener usuario logueado
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // 🔹 Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    // 🔹 Registro de usuario
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:255',
            'surnames'      => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:6|confirmed',
            'fecha_ingreso' => 'required|date',
            'jefe_directo'  => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $usuario = Usuario::create([
            'name'          => $request->name,
            'surnames'      => $request->surnames,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'rol_id'        => 5,
            'activo'        => 1,
            'fecha_ingreso' => $request->fecha_ingreso,
            'jefe_directo'  => $request->jefe_directo,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Usuario registrado correctamente',
            'user'    => $usuario
        ]);
    }

    // 🔹 Obtener todos los usuarios
    public function index()
    {
        $usuarios = Usuario::all();
        return response()->json($usuarios);
    }

    // 🔹 Obtener un usuario por ID
    public function show($id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
        return response()->json($usuario);
    }

    // 🔹 Actualizar un usuario
    public function update(Request $request, $id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'          => 'sometimes|string|max:255',
            'surnames'      => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:users,email,' . $id,
            'password'      => 'sometimes|string|min:6|confirmed',
            'activo'        => 'sometimes|boolean',
            'fecha_ingreso' => 'sometimes|date',
            'jefe_directo'  => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $usuario->update($data);

        return response()->json(['message' => 'Usuario actualizado correctamente', 'user' => $usuario]);
    }

    // 🔹 Eliminar un usuario
    public function destroy($id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $usuario->delete();
        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }

    public function getJefes()
    {
        $jefes = Usuario::where('rol_id', 2)
            ->select('id', 'name', 'surnames')
            ->get();

        return response()->json($jefes);
    }

    public function cambiarPassword(Request $request)
    {
        $request->validate([
            'passwordActual' => 'required|string',
            'passwordNueva' => 'required|string|min:6',
        ]);

        $usuario = auth()->user(); // Usuario logueado vía token

        if (!Hash::check($request->passwordActual, $usuario->password)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta'], 400);
        }

        $usuario->password = Hash::make($request->passwordNueva);
        $usuario->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente'], 200);
    }
}

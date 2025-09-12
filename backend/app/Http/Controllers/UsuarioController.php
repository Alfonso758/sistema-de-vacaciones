<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;


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
                'avatarUrl' => $usuario->avatar ? 'storage/' . $usuario->avatar : null,
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

    public function cambiarAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $usuario = auth()->user();

        // Elimina el avatar anterior si existe y no es el default
        if ($usuario->avatar) {
            // Como guardas la URL completa, hay que obtener la ruta relativa
            $oldPath = str_replace(asset('storage') . '/', '', $usuario->avatar);
            if (\Storage::disk('public')->exists($oldPath)) {
                \Storage::disk('public')->delete($oldPath);
            }
        }

        // Guarda la nueva imagen en la carpeta 'public/avatars'
        $path = $request->file('avatar')->store('avatars', 'public');

        // Construye la URL completa
        $fullUrl = asset('storage/' . $path);

        // Guarda la URL completa en la base de datos
        $usuario->avatar = $fullUrl;
        $usuario->save();

        return response()->json([
            'message' => 'Imagen actualizada correctamente',
            'avatarUrl' => $fullUrl
        ]);
    }

    // 🔹 Actualizar nombre y apellidos del usuario logueado
public function actualizar(Request $request)
{
    $request->validate([
        'nombre'    => 'required|string|max:255',
        'apellidos' => 'required|string|max:255',
    ]);

    $usuario = auth()->user(); // obtiene el usuario autenticado

    $usuario->name = $request->nombre;
    $usuario->surnames = $request->apellidos;
    $usuario->save();

    return response()->json([
        'mensaje' => 'Datos actualizados correctamente',
        'usuario' => [
            'usuarioID' => $usuario->id,
            'nombre'    => $usuario->name,
            'apellidos' => $usuario->surnames,
            'rol_id'    => $usuario->rol_id,
            'email'     => $usuario->email,
            'avatarUrl' => $usuario->avatar ? $usuario->avatar : null,
        ]
    ]);
}

}

<?php

namespace App\Http\Controllers;

use App\Notifications\CuentaNueva;
use App\Notifications\BienvenidaUsuario;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\VacacionesAnuales;
use App\Models\VacacionesUser;


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

        // Crear el usuario
        $usuario = Usuario::create([
            'name'          => $request->name,
            'surnames'      => $request->surnames,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'rol_id'        => $request->rol_id,
            'activo'        => 0,
            'fecha_ingreso' => $request->fecha_ingreso,
            'nuevo'         => 1,
            'jefe_directo'  => $request->jefe_directo,
            'email_verified_at' => now(),
        ]);

        // 📩 Enviar correo
        $usuario->notify(new CuentaNueva());

        /**
         * -------------------------------------------------------------
         *  CREAR REGISTRO EN vacaciones_user
         * -------------------------------------------------------------
         */
        $fechaIngreso = new \DateTime($usuario->fecha_ingreso);
        $fechaActual  = new \DateTime();
        $aniosLaborados = $fechaIngreso->diff($fechaActual)->y; // años trabajados

        // Buscar el rango correcto según los años laborados
        $vacacionesAnuales = VacacionesAnuales::where('anio_inicio', '<=', $aniosLaborados)
            ->where('anio_fin', '>=', $aniosLaborados)
            ->first();

        // Si no se encuentra (por ejemplo, si no hay rango 0), se usa el de 0 años
        if (!$vacacionesAnuales) {
            $vacacionesAnuales = VacacionesAnuales::where('anio_inicio', 0)->first();
        }

        // Calcular el nuevo periodo de vacaciones según la fecha de ingreso
        $anioActual = $fechaActual->format('Y');
        $mesIngreso = $fechaIngreso->format('m');
        $diaIngreso = $fechaIngreso->format('d');

        // Si todavía no llega su aniversario este año, el periodo actual empieza desde la fecha de ingreso
        $fechaInicioPeriodo = new \DateTime("$anioActual-$mesIngreso-$diaIngreso");
        if ($fechaInicioPeriodo > $fechaActual) {
            // Si el aniversario aún no llega, el periodo actual es del año anterior
            $fechaInicioPeriodo->modify('-1 year');
        }

        $fechaFinPeriodo = (clone $fechaInicioPeriodo)->modify('+1 year');

        // Crear el registro en vacaciones_user
        // Solo crear registro en vacaciones_user si NO es Administrador
        if ($usuario->rol_id !== 3) {
            VacacionesUser::create([
                'id_usuario'           => $usuario->id,
                'fecha_inicio_periodo' => $fechaInicioPeriodo->format('Y-m-d'),
                'fecha_fin_periodo'    => $fechaFinPeriodo->format('Y-m-d'),
                'id_dias'              => $vacacionesAnuales->id,
                'dias_otorgados'       => $vacacionesAnuales->dias,
                'dias_acumulados'      => 0,
                'dias_tomados'         => 0,
                'pendiente'            => 0,
            ]);
        }

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
        try {
            $validator = Validator::make($request->all(), [
                'name'          => 'sometimes|string|max:255',
                'surnames'      => 'sometimes|string|max:255|nullable',
                'email'         => 'sometimes|email|unique:users,email,' . $id,
                'password'      => 'sometimes|string|min:6|confirmed',
                'activo'        => 'sometimes|in:0,1',
                'fecha_ingreso' => 'sometimes|date',
                'jefe_directo'  => 'sometimes|nullable|exists:users,id',
                'rol_id'        => 'sometimes|integer|in:1,2,3',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $usuario = Usuario::findOrFail($id);
            $data = $validator->validated();

            // Si 'surnames' viene vacío, se guarda como null
            if (array_key_exists('surnames', $data)) {
                $data['surnames'] = $data['surnames'] === '' ? null : $data['surnames'];
            }

            // Encriptar contraseña si viene
            if (!empty($data['password'])) {
                $data['password'] = bcrypt($data['password']);
            }

            $usuario->update($data);

            return response()->json([
                'message' => 'Usuario actualizado correctamente',
                'user' => $usuario
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage(),
            ], 500);
        }
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
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
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
            'apellidos' => 'nullable|string|max:255',
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

    public function empleadosDelJefe($jefeId)
    {
        $empleados = Usuario::where('jefe_directo', $jefeId)
            ->select('id', 'name', 'surnames', 'rol_id', 'email', 'fecha_ingreso')
            ->get();

        return response()->json($empleados);
    }

    public function usuarios()
    {
        try {
            $usuarios = Usuario::with('jefe')
                ->select('id', 'name', 'surnames', 'rol_id', 'email', 'fecha_ingreso', 'jefe_directo', 'activo', 'nuevo')
                ->where('id', '<>', auth()->id()) // excluye al usuario logueado
                ->orderBy('name', 'asc')
                ->get();

            // Añadir campo jefe_name
            $usuarios->transform(function ($u) {
                $u->jefe_name = $u->jefe
                    ? $u->jefe->name . ' ' . $u->jefe->surnames
                    : null;
                return $u;
            });

            return response()->json($usuarios, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudieron obtener los usuarios',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function usuariosPend()
    {
        try {
            // Busca usuarios con activo = 0 y nuevo = true
            $usuarios = Usuario::where('activo', 0)
                ->where('nuevo', true)
                ->with(['jefe' => function ($query) {
                    $query->select('id', 'name', 'surnames');
                }])
                ->get();

            if ($usuarios->isEmpty()) {
                return response()->json([
                    'message' => 'No hay usuarios pendientes',
                    'data' => []
                ], 200);
            }

            // Añadir campo con el nombre completo del jefe
            $usuarios->transform(function ($u) {
                $u->jefe_name = $u->jefe ? "{$u->jefe->name} {$u->jefe->surnames}" : null;
                return $u;
            });

            return response()->json([
                'message' => 'Usuarios pendientes encontrados',
                'total' => $usuarios->count(),
                'data' => $usuarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener usuarios pendientes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function activarUsuario($id)
    {
        try {
            // Buscar el usuario por ID
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json([
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Cambiar el estado de activo a 1 y nuevo a false
            $usuario->activo = 1;
            $usuario->nuevo = false;
            $usuario->save();

            // 📩 Enviar correo
            $usuario->notify(new BienvenidaUsuario());

            return response()->json([
                'message' => 'El usuario ha sido activado. Si lo deseas, puedes editar sus datos desde la Lista de usuarios.',
                'data' => $usuario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al aprobar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /*public function asignarRol(Request $request, $id)
    {
        try {
            $usuario = Usuario::findOrFail($id);
            $usuario->rol_id = $request->rol_id;
            $usuario->save();

            return response()->json([
                'message' => 'Usuario aprobado',
                'usuario' => $usuario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al asignar rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }*/
}

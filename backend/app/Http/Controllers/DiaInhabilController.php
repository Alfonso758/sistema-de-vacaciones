<?php

namespace App\Http\Controllers;

use App\Models\DiaInhabil;
use Illuminate\Http\Request;

class DiaInhabilController extends Controller
{
    /**
     * Listar todos los días inhábiles
     */
    public function index()
    {
        return response()->json(DiaInhabil::all());
    }

    /**
     * Guardar un nuevo día inhábil
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'fecha' => 'required|date',
            'siempre' => 'required|boolean',
        ]);

        $diaInhabil = DiaInhabil::create($request->all());

        return response()->json($diaInhabil, 201);
    }

    /**
     * Mostrar un día inhábil específico
     */
    public function show($id)
    {
        $diaInhabil = DiaInhabil::findOrFail($id);
        return response()->json($diaInhabil);
    }

    /**
     * Actualizar un día inhábil
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'fecha' => 'sometimes|date',
            'siempre' => 'sometimes|boolean',
        ]);

        $diaInhabil = DiaInhabil::findOrFail($id);
        $diaInhabil->update($request->all());

        return response()->json($diaInhabil);
    }

    /**
     * Eliminar un día inhábil
     */
    public function destroy($id)
    {
        $diaInhabil = DiaInhabil::findOrFail($id);
        $diaInhabil->delete();

        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Google\Client;

class GoogleCalendarController extends Controller
{
    public function redirectToGoogle()
    {
        $client = new Client();
        $client->setAuthConfig(storage_path('app/credentials.json'));
        $client->addScope(\Google\Service\Calendar::CALENDAR);
        $client->setAccessType('offline'); // 🔹 Para obtener refresh_token
        $client->setPrompt('select_account consent');
        $client->setRedirectUri('http://localhost:8000/api/callback');

        return redirect()->away($client->createAuthUrl());
    }

    public function handleCallback(Request $request)
    {
        $client = new Client();
        $client->setAuthConfig(storage_path('app/credentials.json'));
        $client->addScope(\Google\Service\Calendar::CALENDAR);
        $client->setRedirectUri('http://localhost:8000/api/callback');

        $token = $client->fetchAccessTokenWithAuthCode($request->code);

        // 🔹 Guardamos token en archivo
        file_put_contents(storage_path('app/token.json'), json_encode($token));

        return "Autenticación completada ✔, ya puedes crear eventos.";
    }

    public function vacacionesCalendar($fechaInicio, $fechaFin)
    {
        $client = new \Google\Client();
        $client->setAuthConfig(storage_path('app/credentials.json'));
        $client->addScope(\Google\Service\Calendar::CALENDAR);

        // Cargar el token guardado
        $tokenPath = storage_path('app/token.json');
        $token = json_decode(file_get_contents($tokenPath), true);
        $client->setAccessToken($token);

        // Actualizar el token si ya expiró
        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
            file_put_contents($tokenPath, json_encode($client->getAccessToken()));
        }

        $service = new \Google\Service\Calendar($client);

        // Ajustar formato de fechas (YYYY-MM-DD)
        $inicio = date('Y-m-d', strtotime($fechaInicio));
        $fin = date('Y-m-d', strtotime($fechaFin . ' +1 day')); // El final es exclusivo en Google Calendar

        // Crear evento de vacaciones
        $evento = new \Google\Service\Calendar\Event([
            'summary' => 'Vacaciones',
            'description' => "Periodo de vacaciones del $fechaInicio al $fechaFin",
            'start' => [
                'date' => $inicio,
                'timeZone' => 'America/Mexico_City',
            ],
            'end' => [
                'date' => $fin,
                'timeZone' => 'America/Mexico_City',
            ],
        ]);

        // Insertar evento en el calendario principal
        $calendarId = 'primary';
        $eventoCreado = $service->events->insert($calendarId, $evento);

        return "Vacaciones registradas en el calendario: " . $eventoCreado->htmlLink;
    }
}

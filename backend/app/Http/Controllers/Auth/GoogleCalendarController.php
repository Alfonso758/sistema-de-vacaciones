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
}

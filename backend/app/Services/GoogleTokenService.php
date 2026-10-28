<?php

namespace App\Services;

use App\Models\GoogleAccount;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleTokenService
{
    /**
     * Return a valid access token, refreshing it with Google if it is about to expire.
     */
    public function accessTokenFor(GoogleAccount $account): string
    {
        if ($account->expires_at && $account->expires_at->gt(now()->addMinute())) {
            return $account->access_token;
        }

        if (! $account->refresh_token) {
            throw new RuntimeException('Google connection expired. Please reconnect.');
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $account->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Google connection expired. Please reconnect.');
        }

        $account->update([
            'access_token' => $response->json('access_token'),
            'expires_at' => now()->addSeconds((int) $response->json('expires_in')),
        ]);

        return $account->access_token;
    }
}

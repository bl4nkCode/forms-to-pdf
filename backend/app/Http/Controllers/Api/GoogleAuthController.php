<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoogleAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;

class GoogleAuthController extends Controller
{
    private const SCOPES = [
        'https://www.googleapis.com/auth/forms.body.readonly',
        'https://www.googleapis.com/auth/forms.responses.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
    ];

    // Returns the Google driver in stateless mode (no session needed for an API)
    private function googleDriver(): AbstractProvider
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver('google');

        return $driver->stateless();
    }

    // Step 1: React asks for the Google consent URL (authenticated)
    public function redirect(Request $request): JsonResponse
    {
        $state = Str::random(40);
        Cache::put("google_oauth_state:{$state}", $request->user()->id, now()->addMinutes(10));

        $url = $this->googleDriver()
            ->scopes(self::SCOPES)
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => $state,
            ])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    // Step 2: Google sends the browser back here (no Bearer token, identified by state)
    public function callback(Request $request): RedirectResponse
    {
        $frontend = rtrim(config('app.frontend_url'), '/');
        $userId = Cache::pull('google_oauth_state:'.$request->query('state'));

        if (! $userId || $request->has('error')) {
            return redirect("{$frontend}/dashboard?google=error");
        }

        try {
            $googleUser = $this->googleDriver()->user();
        } catch (\Throwable $e) {
            report($e);

            return redirect("{$frontend}/dashboard?google=error");
        }

        // Google lets users untick individual permissions, so verify all were granted
        $granted = $googleUser->approvedScopes ?? [];
        if (! empty($granted) && ! empty(array_diff(self::SCOPES, $granted))) {
            return redirect("{$frontend}/dashboard?google=missing_scopes");
        }

        $existing = GoogleAccount::where('user_id', $userId)->first();

        GoogleAccount::updateOrCreate(
            ['user_id' => $userId],
            [
                'google_id' => $googleUser->getId(),
                'email' => $googleUser->getEmail(),
                'access_token' => $googleUser->token,
                'refresh_token' => $googleUser->refreshToken ?: $existing?->refresh_token,
                'expires_at' => now()->addSeconds((int) $googleUser->expiresIn),
                'scopes' => implode(' ', self::SCOPES),
            ]
        );

        return redirect("{$frontend}/dashboard?google=connected");
    }

    public function status(Request $request): JsonResponse
    {
        $account = $request->user()->googleAccount;

        return response()->json([
            'connected' => (bool) $account,
            'email' => $account?->email,
        ]);
    }

    public function disconnect(Request $request): JsonResponse
    {
        $account = $request->user()->googleAccount;

        if ($account) {
            try {
                Http::asForm()->post('https://oauth2.googleapis.com/revoke', [
                    'token' => $account->refresh_token ?? $account->access_token,
                ]);
            } catch (\Throwable $e) {
                report($e); // still remove our copy even if Google can't be reached
            }

            $account->delete();
        }

        return response()->json(['message' => 'Disconnected']);
    }
}

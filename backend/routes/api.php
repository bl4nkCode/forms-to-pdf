<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Google redirects the browser here, so it can't use a Bearer token
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
    Route::get('/google/status', [GoogleAuthController::class, 'status']);
    Route::delete('/google', [GoogleAuthController::class, 'disconnect']);
});

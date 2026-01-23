<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProcessedFileController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Get current user ID (for frontend to know if logged in)
Route::get('/current-user', function (Request $request) {
    // Prepare response data
    $data = [
        'authenticated' => false,
        'user_id' => null
    ];
    
    if (auth()->check()) {
        $data = [
            'authenticated' => true,
            'user_id' => auth()->id(),
            'user' => [
                'id' => auth()->id(),
                'name' => auth()->user()->name,
                'email' => auth()->user()->email,
            ]
        ];
    }
    
    // Create response with CORS headers - must set headers before json()
    $response = response()->json($data, 200, [
        'Access-Control-Allow-Origin' => 'http://82.180.132.134:3000',
        'Access-Control-Allow-Credentials' => 'true',
        'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers' => 'Content-Type, Accept, Authorization, X-Requested-With',
        'Access-Control-Max-Age' => '3600',
    ]);
    
    return $response;
})->middleware('web'); // Use web middleware to access session

// Handle OPTIONS preflight requests
Route::options('/current-user', function () {
    return response('', 200, [
        'Access-Control-Allow-Origin' => 'http://82.180.132.134:3000',
        'Access-Control-Allow-Credentials' => 'true',
        'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers' => 'Content-Type, Accept, Authorization, X-Requested-With',
        'Access-Control-Max-Age' => '3600',
    ]);
});

// Handle OPTIONS preflight for processed-files
Route::options('/processed-files', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://82.180.132.134:3000')
        ->header('Access-Control-Allow-Credentials', 'true')
        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
});

// Processed Files API (called by Node.js server)
Route::post('/processed-files', [ProcessedFileController::class, 'store'])->name('api.processed-files.store');

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: __DIR__.'/..')
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'api/signature-requests', // Called by /modules/signature/ (same origin, session auth)
            'api/signature-session/*', // Node signing page (port 3000) fetches session
            'signature-pdf/*/sign',    // Node signing page POSTs signed PDF
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

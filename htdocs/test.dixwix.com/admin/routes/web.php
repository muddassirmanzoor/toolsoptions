<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SignatureRequestController;
use App\Http\Controllers\Api\SignatureRequestApiController;
use App\Http\Controllers\SignaturePdfController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/', function () {
    return redirect('/modules/index.html');
});

// Authentication Routes
Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
Route::post('/register', [RegisterController::class, 'register'])->name('register');

Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
Route::get('/logout', [LoginController::class, 'logout'])->name('logout.get'); // GET route for cross-origin logout

// Protected routes
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::put('/dashboard', [DashboardController::class, 'update'])->name('dashboard.update');

    // Security (Profile)
    Route::get('/security', [DashboardController::class, 'security'])->name('dashboard.security');
    Route::put('/security', [DashboardController::class, 'updateSecurity'])->name('dashboard.security.update');

    // Last tasks (Processed files)
    Route::get('/last-tasks', [DashboardController::class, 'tasks'])->name('dashboard.tasks');
    Route::get('/last-tasks/{id}/download', [DashboardController::class, 'downloadFile'])->name('dashboard.tasks.download');
    Route::delete('/last-tasks/{id}', [DashboardController::class, 'deleteFile'])->name('dashboard.tasks.delete');

    // Team (Workspace)
    Route::get('/team', [DashboardController::class, 'team'])->name('dashboard.team');

    // Plans and Packages
    Route::get('/plans', [DashboardController::class, 'plans'])->name('dashboard.plans');
    
    // Premium Upgrade
    Route::get('/premium', [DashboardController::class, 'premium'])->name('dashboard.premium');

    // Invoices (payment history)
    Route::get('/invoices', [DashboardController::class, 'invoices'])->name('dashboard.invoices');
    Route::get('/invoices/{id}/download', [DashboardController::class, 'downloadInvoice'])->name('dashboard.invoices.download');
    Route::delete('/invoices/{id}', [DashboardController::class, 'hideInvoice'])->name('dashboard.invoices.hide');

    // Signatures (overview, sent requests, requester detail, sidebar links)
    Route::get('/user/signatures/overview', [SignatureRequestController::class, 'overview'])->name('signatures.overview');
    Route::get('/user/signatures/requests', [SignatureRequestController::class, 'index'])->name('signatures.requests');
    Route::get('/user/signatures/requester/{requestId}', [SignatureRequestController::class, 'show'])->name('signatures.requester.show');
    Route::get('/user/signatures/inbox', [SignatureRequestController::class, 'inbox'])->name('signatures.inbox');
    Route::get('/user/signatures/signed', function (\Illuminate\Http\Request $r) {
        return redirect()->route('signatures.requests', ['status' => 'completed']);
    })->name('signatures.signed');
    Route::get('/user/signatures/templates', function () { return view('dashboard.signatures.templates'); })->name('signatures.templates');
    Route::get('/user/signatures/contacts', function () { return view('dashboard.signatures.contacts'); })->name('signatures.contacts');
    Route::get('/user/signatures/settings', function () { return view('dashboard.signatures.settings'); })->name('signatures.settings');

    // Signature request API (called by sign tool when "Send to Sign")
    Route::post('/api/signature-requests', [SignatureRequestApiController::class, 'store'])->name('api.signature-requests.store');

    // Download original / signed PDF (requester)
    Route::get('/user/signatures/requester/{requestId}/download-original', [SignatureRequestController::class, 'downloadOriginal'])->name('signatures.requester.download-original');
    Route::get('/user/signatures/requester/{requestId}/download-signed', [SignatureRequestController::class, 'downloadSigned'])->name('signatures.requester.download-signed');

    // Payment routes
    Route::post('/api/payment/create-intent', [PaymentController::class, 'createPaymentIntent'])->name('payment.create-intent');
    Route::post('/api/payment/confirm', [PaymentController::class, 'confirmPayment'])->name('payment.confirm');
});

// Webhook routes (no auth required)
Route::post('/api/payment/webhook', [PaymentController::class, 'handleWebhook'])->name('payment.webhook');

// API for Node signing page (port 3000): session data by token (public)
Route::get('/api/signature-session/{token}', [SignaturePdfController::class, 'session'])->name('api.signature-session');

// Guest signing (public - token in URL)
Route::get('/signature-pdf/{token}', [SignaturePdfController::class, 'show'])->name('signature-pdf.show');
Route::get('/signature-pdf-thank-you', [SignaturePdfController::class, 'thankYou'])->name('signature-pdf.thank-you');
Route::get('/signature-pdf/{token}/download-signed', [SignaturePdfController::class, 'downloadSigned'])->name('signature-pdf.download-signed');
Route::post('/signature-pdf/{token}/accept-terms', [SignaturePdfController::class, 'acceptTerms'])->name('signature-pdf.accept-terms');
Route::get('/signature-pdf/{token}/document', [SignaturePdfController::class, 'document'])->name('signature-pdf.document');
Route::options('/signature-pdf/{token}/sign', function (\Illuminate\Http\Request $request) {
    return response('', 204)
        ->header('Access-Control-Allow-Origin', $request->header('Origin') ?: '*')
        ->header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        ->header('Access-Control-Max-Age', '86400');
});
Route::post('/signature-pdf/{token}/sign', [SignaturePdfController::class, 'sign'])->name('signature-pdf.sign');

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');
});

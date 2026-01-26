<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Admin\DashboardController;

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
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');
});

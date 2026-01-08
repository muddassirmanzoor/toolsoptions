<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Show user dashboard.
     */
    public function index()
    {
        return view('dashboard.index', [
            'user' => auth()->user()
        ]);
    }

    /**
     * Show admin dashboard.
     */
    public function admin()
    {
        $users = User::latest()->paginate(10);
        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        
        return view('admin.dashboard', [
            'users' => $users,
            'totalUsers' => $totalUsers,
            'totalAdmins' => $totalAdmins,
        ]);
    }
}

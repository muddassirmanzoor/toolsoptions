<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
     * Update authenticated user's account info.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone_number' => ['nullable', 'string', 'max:20', 'regex:/^[0-9\s\-\+\(\)]+$/'],
            'country_code' => ['nullable', 'string', 'max:10', 'regex:/^\+\d{1,4}$/'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'business_address' => ['nullable', 'string', 'max:500'],
            'tax_id' => ['nullable', 'string', 'max:100'],
        ]);

        $user->fill([
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'country_code' => $validated['country_code'] ?? null,
            'company_name' => $validated['company_name'] ?? null,
            'business_address' => $validated['business_address'] ?? null,
            'tax_id' => $validated['tax_id'] ?? null,
        ]);

        // Keep `name` in sync for backward compatibility
        $fullName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
        if ($fullName !== '') {
            $user->name = $fullName;
        }

        $user->save();

        return redirect()->route('dashboard')->with('success', 'Account information updated successfully.');
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

    /**
     * Show Security page (Profile -> Security).
     */
    public function security()
    {
        return view('dashboard.security', [
            'user' => auth()->user(),
            // For now, 2FA is UI-only (no backend integration yet)
            'twoFactorEnabled' => false,
            'showTwoFactor' => false,
        ]);
    }

    /**
     * Show "Last tasks" page (processed files history).
     */
    public function tasks()
    {
        // NOTE: This is currently UI-only (no backing table/model yet).
        // Swap this array for a DB query once processed jobs are persisted.
        $tasks = collect([
            [
                'date' => 'Aug 29, 2024',
                'tool' => 'Compress PDF',
                'files' => 2,
                'status' => 'Completed',
            ],
            [
                'date' => 'Aug 29, 2024',
                'tool' => 'Compress PDF',
                'files' => 2,
                'status' => 'Completed',
            ],
            [
                'date' => 'Aug 29, 2024',
                'tool' => 'Compress PDF',
                'files' => 2,
                'status' => 'Completed',
            ],
            [
                'date' => 'Aug 29, 2024',
                'tool' => 'Compress PDF',
                'files' => 2,
                'status' => 'Completed',
            ],
            [
                'date' => 'Aug 29, 2024',
                'tool' => 'Compress PDF',
                'files' => 2,
                'status' => 'Completed',
            ],
        ]);

        return view('dashboard.tasks', [
            'tasks' => $tasks,
            'totalFiles' => $tasks->count(),
        ]);
    }

    /**
     * Update Security settings (password change, 2FA placeholder).
     */
    public function updateSecurity(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate(
            [
                // Password change
                'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
                'current_password' => ['required_with:new_password', 'current_password'],

                // 2FA (UI only for now)
                'two_factor_password' => ['nullable', 'string', 'max:255'],
                'authenticator_code' => ['nullable', 'string', 'max:32'],
            ],
            [
                'current_password.current_password' => 'Current password is incorrect.',
                'current_password.required_with' => 'Please enter your current password to change it.',
            ]
        );

        if (!empty($validated['new_password'])) {
            $user->password = Hash::make($validated['new_password']);
            $user->save();

            return redirect()->route('dashboard.security')->with('success', 'Password updated successfully.');
        }

        // 2FA enable/disable is not implemented yet (UI matches design)
        return redirect()->route('dashboard.security')->with('error', 'No password change was made.');
    }
}

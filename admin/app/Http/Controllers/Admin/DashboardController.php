<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Payment;
use App\Models\ProcessedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
        $userId = auth()->id();
        \Log::info('DashboardController::tasks called', [
            'user_id' => $userId,
            'authenticated' => auth()->check(),
        ]);
        
        // Only show non-deleted files (soft delete)
        $tasks = ProcessedFile::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        \Log::info('ProcessedFile query result', [
            'user_id' => $userId,
            'tasks_count' => $tasks->count(),
            'task_ids' => $tasks->pluck('id')->toArray(),
        ]);

        return view('dashboard.tasks', [
            'tasks' => $tasks,
            'totalFiles' => $tasks->count(),
        ]);
    }

    /**
     * Download a processed file.
     */
    public function downloadFile($id)
    {
        // Only allow download of non-deleted files (soft delete)
        $file = ProcessedFile::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        if (!$file->file_path) {
            return redirect()->route('dashboard.tasks')
                ->with('error', 'File not found or has been deleted.');
        }

        // Try multiple storage locations
        $filePath = $file->file_path;
        $fullPath = null;

        // Check in Laravel storage
        if (Storage::disk('local')->exists($filePath)) {
            $fullPath = Storage::disk('local')->path($filePath);
        }
        // Check in processed_files directory
        elseif (Storage::disk('local')->exists('processed_files/' . basename($filePath))) {
            $fullPath = Storage::disk('local')->path('processed_files/' . basename($filePath));
        }
        // Check absolute path (for files stored by Node.js)
        elseif (file_exists($filePath)) {
            $fullPath = $filePath;
        }
        // Check in admin storage directory
        else {
            $adminStoragePath = storage_path('app/processed_files/' . basename($filePath));
            if (file_exists($adminStoragePath)) {
                $fullPath = $adminStoragePath;
            }
        }

        if (!$fullPath || !file_exists($fullPath)) {
            return redirect()->route('dashboard.tasks')
                ->with('error', 'File not found or has been deleted.');
        }

        return response()->download($fullPath, $file->original_filename ?? basename($filePath));
    }

    /**
     * Delete a processed file (soft delete).
     * Files are not physically deleted, only marked as deleted.
     */
    public function deleteFile($id)
    {
        $file = ProcessedFile::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        // Soft delete - only mark as deleted, don't delete physical file
        $file->delete();

        return redirect()->route('dashboard.tasks')
            ->with('success', 'File deleted successfully.');
    }

    /**
     * Show Team/Workspace page.
     */
    public function team()
    {
        return view('dashboard.team', [
            'user' => auth()->user(),
        ]);
    }

    /**
     * Show Plans and Packages page.
     */
    public function plans()
    {
        return view('dashboard.plans', [
            'user' => auth()->user(),
        ]);
    }

    /**
     * Show Premium upgrade page.
     */
    public function premium()
    {
        return view('dashboard.premium', [
            'user' => auth()->user(),
        ]);
    }

    /**
     * Show Invoice history page (payments from Premium + Plans checkout).
     */
    public function invoices()
    {
        $user = auth()->user();
        $invoices = Payment::where('user_id', $user->id)
            ->visible()
            ->with('subscription')
            ->orderBy('created_at', 'desc')
            ->get();

        return view('dashboard.invoices', [
            'user' => $user,
            'invoices' => $invoices,
            'totalInvoices' => $invoices->count(),
        ]);
    }

    /**
     * Download invoice as printable HTML.
     */
    public function downloadInvoice($id)
    {
        $payment = Payment::where('user_id', auth()->id())
            ->visible()
            ->with('subscription', 'user')
            ->findOrFail($id);

        return response()->view('dashboard.invoice-download', [
            'payment' => $payment,
        ], 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="invoice-' . $payment->id . '.html"',
        ]);
    }

    /**
     * Hide (soft-remove) an invoice from the user's list.
     */
    public function hideInvoice($id)
    {
        $payment = Payment::where('user_id', auth()->id())
            ->visible()
            ->findOrFail($id);

        $payment->update(['hidden_at' => now()]);

        return redirect()->route('dashboard.invoices')
            ->with('success', 'Invoice removed from your history.');
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

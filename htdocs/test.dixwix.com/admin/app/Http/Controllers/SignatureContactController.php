<?php

namespace App\Http\Controllers;

use App\Models\SignatureContact;
use Illuminate\Http\Request;

class SignatureContactController extends Controller
{
    /**
     * List the authenticated user's signature contacts.
     */
    public function index(Request $request)
    {
        $contacts = SignatureContact::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return view('dashboard.signatures.contacts', [
            'contacts' => $contacts,
        ]);
    }

    /**
     * Store a new contact.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
        ]);

        $exists = SignatureContact::where('user_id', $request->user()->id)
            ->where('email', $validated['email'])
            ->exists();

        if ($exists) {
            return redirect()
                ->route('signatures.contacts')
                ->with('error', 'A contact with this email already exists.');
        }

        SignatureContact::create([
            'user_id' => $request->user()->id,
            'name'    => $validated['name'],
            'email'   => $validated['email'],
            'phone'   => $validated['phone'] ?? null,
            'company' => $validated['company'] ?? null,
        ]);

        return redirect()
            ->route('signatures.contacts')
            ->with('success', 'Contact added.');
    }

    /**
     * Update an existing contact.
     */
    public function update(Request $request, SignatureContact $contact)
    {
        if ($contact->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
        ]);

        $duplicate = SignatureContact::where('user_id', $request->user()->id)
            ->where('email', $validated['email'])
            ->where('id', '!=', $contact->id)
            ->exists();

        if ($duplicate) {
            return redirect()
                ->route('signatures.contacts')
                ->with('error', 'Another contact already has this email.');
        }

        $contact->update($validated);

        return redirect()
            ->route('signatures.contacts')
            ->with('success', 'Contact updated.');
    }

    /**
     * Delete a contact.
     */
    public function destroy(Request $request, SignatureContact $contact)
    {
        if ($contact->user_id !== $request->user()->id) {
            abort(404);
        }

        $contact->delete();

        return redirect()
            ->route('signatures.contacts')
            ->with('success', 'Contact removed.');
    }
}

<?php

namespace Database\Seeders;

use App\Models\SignatureRequest;
use App\Models\SignatureReceiver;
use App\Models\SignatureEvent;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SignatureRequestSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        if (!$user) {
            return;
        }

        $requests = [
            [
                'document_name' => 'Application Form_0.pdf',
                'status' => 'completed',
                'completed_at' => now(),
                'receiver_name' => 'muddassir manzoor',
                'receiver_email' => $user->email,
                'events' => [
                    ['role' => 'Requester', 'who' => $user->name ?? $user->email, 'event' => 'Signature request created'],
                    ['role' => 'System', 'who' => '-', 'event' => 'An email has been sent to ' . $user->email . ' informing them to sign the documents'],
                ],
            ],
            [
                'document_name' => 'interview letter 06-11-2025(13).pdf',
                'status' => 'pending',
                'expires_at' => now()->addDays(15),
                'receiver_name' => 'sd',
                'receiver_email' => 'sd@example.com',
                'events' => [
                    ['role' => 'Requester', 'who' => $user->name ?? $user->email, 'event' => 'Signature request created'],
                    ['role' => 'System', 'who' => '-', 'event' => 'An email has been sent to sd@example.com informing them to sign the documents'],
                ],
            ],
        ];

        foreach ($requests as $i => $data) {
            $req = SignatureRequest::create([
                'user_id' => $user->id,
                'request_id' => strtoupper(Str::uuid()->toString()),
                'document_name' => $data['document_name'],
                'file_path' => null,
                'status' => $data['status'],
                'expires_at' => $data['expires_at'] ?? null,
                'completed_at' => $data['completed_at'] ?? null,
                'settings' => ['receiver_order' => false, 'reminders_days' => 1],
            ]);

            SignatureReceiver::create([
                'signature_request_id' => $req->id,
                'name' => $data['receiver_name'],
                'email' => $data['receiver_email'],
                'role' => 'signer',
                'order' => 1,
                'status' => $data['status'] === 'completed' ? 'signed' : 'sent',
                'last_action_at' => now(),
                'signed_at' => $data['status'] === 'completed' ? now()->format('m/d/Y') : null,
                'token' => Str::random(32),
            ]);

            foreach ($data['events'] as $ev) {
                SignatureEvent::create([
                    'signature_request_id' => $req->id,
                    'role' => $ev['role'],
                    'who' => $ev['who'],
                    'event' => $ev['event'],
                ]);
            }
        }
    }
}

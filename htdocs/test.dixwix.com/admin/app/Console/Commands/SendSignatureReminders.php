<?php

namespace App\Console\Commands;

use App\Mail\SignatureRequestReminder;
use App\Models\SignatureEvent;
use App\Models\SignatureReceiver;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class SendSignatureReminders extends Command
{
    protected $signature = 'signature:send-reminders';

    protected $description = 'Send reminder emails to receivers who have not signed yet (based on reminders_days setting).';

    public function handle(): int
    {
        $remindersDays = 1; // default
        $now = now();

        $receivers = SignatureReceiver::query()
            ->with('signatureRequest')
            ->where('status', 'sent')
            ->whereHas('signatureRequest', function ($q) use ($now) {
                $q->where('status', 'pending')
                    ->where(function ($q) use ($now) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
                    });
            })
            ->get();

        $sent = 0;
        foreach ($receivers as $receiver) {
            $request = $receiver->signatureRequest;
            $days = (int) ($request->settings['reminders_days'] ?? 1);
            if ($days < 1) {
                continue;
            }

            $lastReminderAt = $receiver->last_reminder_at;
            $invitationSentAt = $receiver->created_at;

            $nextReminderDue = $lastReminderAt
                ? Carbon::parse($lastReminderAt)->addDays($days)
                : Carbon::parse($invitationSentAt)->addDays($days);

            if ($nextReminderDue->isAfter($now)) {
                continue;
            }

            try {
                Mail::to($receiver->email)->send(new SignatureRequestReminder($request, $receiver));
            } catch (\Throwable $e) {
                report($e);
                $this->warn("Failed to send reminder to {$receiver->email}: " . $e->getMessage());
                continue;
            }

            $receiver->update(['last_reminder_at' => $now]);

            $emailId = substr(str_replace(['+', '/', '='], '', base64_encode(random_bytes(12))), 0, 22);
            SignatureEvent::create([
                'signature_request_id' => $request->id,
                'role' => 'System',
                'who' => '-',
                'event' => "An email ({$emailId}) has been sent to {$receiver->email} reminding them to sign the document",
            ]);

            $sent++;
        }

        if ($sent > 0) {
            $this->info("Sent {$sent} reminder(s).");
        }

        return self::SUCCESS;
    }
}

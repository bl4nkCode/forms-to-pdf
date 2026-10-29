<?php

namespace App\Jobs;

use App\Exceptions\ExportException;
use App\Exceptions\GoogleApiException;
use App\Models\Export;
use App\Services\GoogleFormsService;
use App\Services\PdfExportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class GenerateExportPdf implements ShouldQueue
{
    use Queueable;

    // No automatic retries: a retry would hit Google again and rebuild a big PDF
    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public int $exportId)
    {
    }

    public function handle(GoogleFormsService $forms, PdfExportService $pdfs): void
    {
        $export = Export::find($this->exportId);

        // Deleted while waiting in the queue, or already handled
        if (! $export || $export->status !== 'pending') {
            return;
        }

        $account = $export->user->googleAccount;

        if (! $account) {
            $this->markFailed($export, 'Your Google account is no longer connected.');

            return;
        }

        try {
            $form = $forms->getForm($account, $export->google_form_id);
            $pdfs->generate($export, $account, $form);
        } catch (GoogleApiException|ExportException $e) {
            $this->markFailed($export, $e->getMessage());
        } catch (Throwable $e) {
            report($e);
            $this->markFailed($export, 'The PDF could not be generated.');
        }
    }

    // Called by Laravel if the job crashes or runs out of attempts
    public function failed(?Throwable $exception): void
    {
        $export = Export::find($this->exportId);

        if ($export && in_array($export->status, ['pending', 'processing'], true)) {
            $this->markFailed($export, 'The export took too long or crashed. Please try again.');
        }
    }

    private function markFailed(Export $export, string $message): void
    {
        $export->update(['status' => 'failed', 'error_message' => $message]);
    }
}

<?php

namespace App\Services;

use App\Models\Export;
use App\Models\GoogleAccount;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Throwable;

class PdfExportService
{
    /**
     * Build the PDF for an export, store it, and update the export record.
     * ($account is unused for blank forms; the responses export in Step 8 needs it.)
     */
    public function generate(Export $export, GoogleAccount $account, array $form): void
    {
        $export->update(['status' => 'processing', 'error_message' => null]);

        try {
            $pdf = match ($export->type) {
                'blank' => $this->blankForm($export, $form),
                default => throw new InvalidArgumentException("Unsupported export type: {$export->type}"),
            };

            $path = "exports/{$export->user_id}/{$export->id}.pdf";
            Storage::disk('local')->put($path, $pdf->output());

            $export->update(['status' => 'completed', 'file_path' => $path]);
        } catch (Throwable $e) {
            $export->update([
                'status' => 'failed',
                'error_message' => 'The PDF could not be generated.',
            ]);

            throw $e;
        }
    }

    private function blankForm(Export $export, array $form): DomPdf
    {
        $settings = $export->options ?? [];

        return Pdf::loadView('pdf.blank-form', [
            'form' => $form,
            'settings' => $settings,
        ])->setPaper($settings['paper'] ?? 'a4', 'portrait');
    }
}

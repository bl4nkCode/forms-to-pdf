<?php

namespace App\Services;

use App\Exceptions\ExportException;
use App\Models\Export;
use App\Models\GoogleAccount;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Throwable;
use App\Exceptions\GoogleApiException;

class PdfExportService
{
    // Synchronous exports are capped until we move them to queued jobs
    private const PER_PAGE_LIMIT = 200;

    private const TABLE_LIMIT = 500;

    private const COLUMNS_PER_TABLE = 6;

    public function __construct(
        private GoogleFormsService $forms,
        private FormSummaryService $summaries,
    ) {}

    /**
     * Build the PDF for an export, store it, and update the export record.
     */
    public function generate(Export $export, GoogleAccount $account, array $form): void
    {
        $export->update(['status' => 'processing', 'error_message' => null]);

        try {
            $pdf = match ($export->type) {
                'blank' => $this->blankForm($export, $form),
                'responses' => $this->responses($export, $account, $form),
                'summary' => $this->summary($export, $account, $form),
                default => throw new InvalidArgumentException("Unsupported export type: {$export->type}"),
            };

            $path = "exports/{$export->user_id}/{$export->id}.pdf";
            Storage::disk('local')->put($path, $pdf->output());

            $export->update(['status' => 'completed', 'file_path' => $path]);
        } catch (Throwable $e) {
            $export->update([
                'status' => 'failed',
                'error_message' => $e instanceof ExportException || $e instanceof GoogleApiException
                    ? $e->getMessage()
                    : 'The PDF could not be generated.',
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

    private function responses(Export $export, GoogleAccount $account, array $form): DomPdf
    {
        $this->allowHeavyWork();

        $settings = $export->options ?? [];
        $layout = ($settings['layout'] ?? 'table') === 'per_page' ? 'per_page' : 'table';

        $result = $this->forms->getResponses($account, $export->google_form_id);
        $all = collect($result['responses'])->sortBy('submitted_at')->values();

        if ($all->isEmpty()) {
            throw new ExportException('This form has no responses to export yet.');
        }

        $limit = $layout === 'per_page' ? self::PER_PAGE_LIMIT : self::TABLE_LIMIT;
        $shown = $all->take($limit)->values();

        $rows = $shown->map(fn(array $response, int $index) => [
            'number' => $index + 1,
            'submitted' => $this->formatTime($response['submitted_at'], 'M j, Y g:i A'),
            'email' => $response['email'],
            'answers' => $response['answers'],
        ])->all();

        $notice = null;
        if ($shown->count() < $all->count() || $result['truncated']) {
            $notice = "Showing the first {$shown->count()} responses. Exports are limited for very large forms.";
        }

        $questions = collect($form['items'])->where('kind', 'question')->values()->all();

        $view = $layout === 'per_page' ? 'pdf.responses-per-page' : 'pdf.responses-table';

        return Pdf::loadView($view, [
            'form' => $form,
            'questions' => $questions,
            'rows' => $rows,
            'notice' => $notice,
            'columnsPerTable' => self::COLUMNS_PER_TABLE,
        ])->setPaper(
            $settings['paper'] ?? 'a4',
            $layout === 'table' ? 'landscape' : 'portrait'
        );
    }

    private function summary(Export $export, GoogleAccount $account, array $form): DomPdf
    {
        $this->allowHeavyWork();

        $settings = $export->options ?? [];

        $result = $this->forms->getResponses($account, $export->google_form_id);

        if ($result['count'] === 0) {
            throw new ExportException('This form has no responses to summarize yet.');
        }

        $summary = $this->summaries->build($form, $result);

        return Pdf::loadView('pdf.summary', [
            'form' => $form,
            'summary' => $summary,
            'settings' => $settings,
            'firstSubmitted' => $this->formatTime($summary['first_submitted_at'], 'M j, Y'),
            'lastSubmitted' => $this->formatTime($summary['last_submitted_at'], 'M j, Y'),
        ])->setPaper($settings['paper'] ?? 'a4', 'portrait');
    }

    // Big PDFs need more time and memory than the defaults
    private function allowHeavyWork(): void
    {
        @set_time_limit(180);
        @ini_set('memory_limit', '512M');
    }

    private function formatTime(?string $iso, string $format): string
    {
        if (! $iso) {
            return '';
        }

        return Carbon::parse($iso)->setTimezone(config('app.timezone'))->format($format);
    }
}

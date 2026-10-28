<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\GoogleApiException;
use App\Http\Controllers\Controller;
use App\Models\Export;
use App\Services\GoogleFormsService;
use App\Services\PdfExportService;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(
        private GoogleFormsService $forms,
        private PdfExportService $pdfs,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $exports = Export::where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json($exports);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'form_id' => ['required', 'string', 'max:200', 'regex:/^[A-Za-z0-9_-]+$/'],
            'type' => ['required', Rule::in(['blank'])],
            'options' => ['sometimes', 'array'],
            'options.paper' => ['sometimes', Rule::in(['a4', 'letter'])],
            'options.answer_lines' => ['sometimes', 'boolean'],
        ]);

        $account = $request->user()->googleAccount;

        if (! $account) {
            return response()->json([
                'message' => 'Connect your Google account first.',
                'code' => 'google_not_connected',
            ], 409);
        }

        $settings = [
            'paper' => $request->input('options.paper', 'a4'),
            'answer_lines' => $request->boolean('options.answer_lines', true),
        ];

        try {
            $form = $this->forms->getForm($account, $data['form_id']);

            $export = Export::create([
                'user_id' => $request->user()->id,
                'google_form_id' => $data['form_id'],
                'form_title' => Str::limit($form['title'], 250, ''),
                'type' => $data['type'],
                'options' => $settings,
                'status' => 'pending',
            ]);

            $this->pdfs->generate($export, $account, $form);
        } catch (GoogleApiException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => $e->errorCode,
            ], $e->status);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Could not generate the PDF.'], 500);
        }

        return response()->json($export->fresh(), 201);
    }

    public function download(Request $request, Export $export): StreamedResponse|JsonResponse
    {
        // Other users' exports look like they don't exist
        abort_unless($export->user_id === $request->user()->id, 404);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        if ($export->status !== 'completed' || ! $export->file_path || ! $disk->exists($export->file_path)) {
            return response()->json(['message' => 'This export is not available.'], 404);
        }

        return $disk->download($export->file_path, $export->filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}

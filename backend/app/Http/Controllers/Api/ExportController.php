<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\GoogleApiException;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateExportPdf;
use App\Models\Export;
use App\Services\GoogleFormsService;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(private GoogleFormsService $forms)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $exports = Export::where('user_id', $request->user()->id)
            ->latest('id')
            ->paginate(10);

        return response()->json($exports);
    }

    public function show(Request $request, Export $export): JsonResponse
    {
        abort_unless($export->user_id === $request->user()->id, 404);

        return response()->json($export);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'form_id' => ['required', 'string', 'max:200', 'regex:/^[A-Za-z0-9_-]+$/'],
            'type' => ['required', Rule::in(['blank', 'responses', 'summary'])],
            'options' => ['sometimes', 'array'],
            'options.paper' => ['sometimes', Rule::in(['a4', 'letter'])],
            'options.answer_lines' => ['sometimes', 'boolean'],
            'options.layout' => ['sometimes', Rule::in(['table', 'per_page'])],
            'options.text_samples' => ['sometimes', 'boolean'],
        ]);

        $account = $request->user()->googleAccount;

        if (! $account) {
            return response()->json([
                'message' => 'Connect your Google account first.',
                'code' => 'google_not_connected',
            ], 409);
        }

        // Stop one user from flooding the queue (old unfinished rows are ignored)
        $active = Export::where('user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'processing'])
            ->where('created_at', '>', now()->subMinutes(15))
            ->count();

        if ($active >= 3) {
            return response()->json([
                'message' => 'You already have exports in progress. Please wait for them to finish.',
                'code' => 'too_many_exports',
            ], 429);
        }

        $settings = [
            'paper' => $request->input('options.paper', 'a4'),
            'answer_lines' => $request->boolean('options.answer_lines', true),
            'layout' => $request->input('options.layout', 'table'),
            'text_samples' => $request->boolean('options.text_samples', true),
        ];

        try {
            // A quick check that the form exists and is accessible, and we need its title
            $form = $this->forms->getForm($account, $data['form_id']);
        } catch (GoogleApiException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => $e->errorCode,
            ], $e->status);
        }

        $export = Export::create([
            'user_id' => $request->user()->id,
            'google_form_id' => $data['form_id'],
            'form_title' => Str::limit($form['title'], 250, ''),
            'type' => $data['type'],
            'options' => $settings,
            'status' => 'pending',
        ]);

        dispatch(new GenerateExportPdf($export->id));

        return response()->json($export, 202);
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

    public function destroy(Request $request, Export $export): JsonResponse
    {
        abort_unless($export->user_id === $request->user()->id, 404);

        if ($export->file_path) {
            Storage::disk('local')->delete($export->file_path);
        }

        $export->delete();

        return response()->json(['message' => 'Export deleted.']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\GoogleApiException;
use App\Http\Controllers\Controller;
use App\Models\GoogleAccount;
use App\Services\FormSummaryService;
use App\Services\GoogleFormsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormController extends Controller
{
    public function __construct(
        private GoogleFormsService $forms,
        private FormSummaryService $summaries,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->respond($request, fn(GoogleAccount $account) => $this->forms->listForms(
            $account,
            $request->query('page_token')
        ));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->respond($request, fn(GoogleAccount $account) => $this->forms->getForm($account, $id));
    }

    public function responses(Request $request, string $id): JsonResponse
    {
        return $this->respond($request, fn(GoogleAccount $account) => $this->forms->getResponses($account, $id));
    }

    public function summary(Request $request, string $id): JsonResponse
    {
        return $this->respond($request, function (GoogleAccount $account) use ($id) {
            $form = $this->forms->getForm($account, $id);
            $result = $this->forms->getResponses($account, $id);

            return $this->summaries->build($form, $result);
        });
    }

    /**
     * Run a Google call for the current user and turn failures into clean JSON errors.
     */
    private function respond(Request $request, callable $callback): JsonResponse
    {
        $account = $request->user()->googleAccount;

        if (! $account) {
            return response()->json([
                'message' => 'Connect your Google account first.',
                'code' => 'google_not_connected',
            ], 409);
        }

        try {
            return response()->json($callback($account));
        } catch (GoogleApiException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => $e->errorCode,
            ], $e->status);
        }
    }


    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'url' => ['required', 'url', 'max:2048'],
        ]);

        $url = $data['url'];
        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        $path = parse_url($url, PHP_URL_PATH) ?? '';

        if (! in_array($host, ['docs.google.com', 'forms.google.com'], true)) {
            return response()->json([
                'message' => 'Please provide a valid Google Forms link.',
                'code' => 'invalid_form_url',
            ], 422);
        }

        // Public respondent links often use /forms/d/e/FORM_ID/viewform.
        // The "e" form ID may not be usable with the Google Forms API.
        if (preg_match('~^/forms/d/e/([A-Za-z0-9_-]+)~', $path, $matches)) {
            return response()->json([
                'message' => 'This is a respondent link. Google may not allow the API to retrieve this form using this link. Please try an editor link from a form you own or can edit.',
                'code' => 'respondent_link',
            ], 422);
        }

        if (! preg_match('~^/forms/d/([A-Za-z0-9_-]+)~', $path, $matches)) {
            return response()->json([
                'message' => 'Could not extract a form ID from this link. Please use a Google Forms link.',
                'code' => 'invalid_form_url',
            ], 422);
        }

        $formId = $matches[1];

        return $this->respond(
            $request,
            fn(GoogleAccount $account) => $this->forms->getForm($account, $formId)
        );
    }
}

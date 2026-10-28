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
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return $this->respond($request, fn (GoogleAccount $account) => $this->forms->listForms(
            $account,
            $request->query('page_token')
        ));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->respond($request, fn (GoogleAccount $account) => $this->forms->getForm($account, $id));
    }

    public function responses(Request $request, string $id): JsonResponse
    {
        return $this->respond($request, fn (GoogleAccount $account) => $this->forms->getResponses($account, $id));
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
}

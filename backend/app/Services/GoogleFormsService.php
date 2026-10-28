<?php

namespace App\Services;

use App\Exceptions\GoogleApiException;
use App\Models\GoogleAccount;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class GoogleFormsService
{
    private const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

    private const FORMS_URL = 'https://forms.googleapis.com/v1/forms';

    private const MAX_RESPONSES = 1000;

    public function __construct(private GoogleTokenService $tokens)
    {
    }

    /**
     * List the user's Google Forms (via Drive, since the Forms API has no list call).
     */
    public function listForms(GoogleAccount $account, ?string $pageToken = null): array
    {
        $params = [
            'q' => "mimeType='application/vnd.google-apps.form' and trashed=false",
            'fields' => 'nextPageToken,files(id,name,modifiedTime,webViewLink)',
            'orderBy' => 'modifiedTime desc',
            'pageSize' => 30,
        ];

        if ($pageToken) {
            $params['pageToken'] = $pageToken;
        }

        $data = $this->get($account, self::DRIVE_FILES_URL, $params);

        return [
            'forms' => collect($data['files'] ?? [])
                ->map(fn ($file) => [
                    'id' => $file['id'],
                    'title' => $file['name'],
                    'modified_at' => $file['modifiedTime'] ?? null,
                    'url' => $file['webViewLink'] ?? null,
                ])
                ->values()
                ->all(),
            'next_page_token' => $data['nextPageToken'] ?? null,
        ];
    }

    /**
     * Get a form's structure in a simple, flat format.
     */
    public function getForm(GoogleAccount $account, string $formId): array
    {
        $form = $this->get($account, self::FORMS_URL.'/'.rawurlencode($formId));

        return [
            'id' => $form['formId'],
            'title' => $form['info']['title'] ?? $form['info']['documentTitle'] ?? 'Untitled form',
            'description' => $form['info']['description'] ?? null,
            'items' => $this->normalizeItems($form['items'] ?? []),
        ];
    }

    /**
     * Get a form's responses (up to MAX_RESPONSES) in a simple format.
     */
    public function getResponses(GoogleAccount $account, string $formId): array
    {
        $responses = [];
        $pageToken = null;
        $truncated = false;

        do {
            $params = ['pageSize' => 500];

            if ($pageToken) {
                $params['pageToken'] = $pageToken;
            }

            $data = $this->get(
                $account,
                self::FORMS_URL.'/'.rawurlencode($formId).'/responses',
                $params
            );

            foreach ($data['responses'] ?? [] as $response) {
                if (count($responses) >= self::MAX_RESPONSES) {
                    $truncated = true;
                    break 2;
                }

                $responses[] = $this->normalizeResponse($response);
            }

            $pageToken = $data['nextPageToken'] ?? null;
        } while ($pageToken);

        return [
            'responses' => $responses,
            'count' => count($responses),
            'truncated' => $truncated,
        ];
    }

    // ---------------------------------------------------------------
    // Normalizing Google's format into something simple
    // ---------------------------------------------------------------

    private function normalizeItems(array $items): array
    {
        $result = [];

        foreach ($items as $item) {
            $title = $item['title'] ?? '';
            $description = $item['description'] ?? null;

            if (isset($item['questionItem']['question'])) {
                $result[] = $this->normalizeQuestion($item['questionItem']['question'], $title, $description);
            } elseif (isset($item['questionGroupItem'])) {
                $group = $item['questionGroupItem'];
                $columns = collect($group['grid']['columns']['options'] ?? [])->pluck('value')->all();
                $multiple = ($group['grid']['columns']['type'] ?? 'RADIO') === 'CHECKBOX';

                foreach ($group['questions'] ?? [] as $row) {
                    $result[] = [
                        'kind' => 'question',
                        'id' => $row['questionId'],
                        'type' => 'grid',
                        'title' => trim($title.' - '.($row['rowQuestion']['title'] ?? '')),
                        'description' => $description,
                        'required' => (bool) ($row['required'] ?? false),
                        'options' => $columns,
                        'multiple' => $multiple,
                    ];
                }
            } elseif (isset($item['pageBreakItem'])) {
                $result[] = ['kind' => 'section', 'title' => $title, 'description' => $description];
            } elseif (isset($item['textItem'])) {
                $result[] = ['kind' => 'text', 'title' => $title, 'description' => $description];
            }
            // Image and video items are skipped
        }

        return $result;
    }

    private function normalizeQuestion(array $question, string $title, ?string $description): array
    {
        $normalized = [
            'kind' => 'question',
            'id' => $question['questionId'],
            'type' => 'text',
            'title' => $title,
            'description' => $description,
            'required' => (bool) ($question['required'] ?? false),
            'options' => [],
        ];

        if (isset($question['choiceQuestion'])) {
            $choice = $question['choiceQuestion'];

            $normalized['type'] = match ($choice['type'] ?? 'RADIO') {
                'CHECKBOX' => 'checkbox',
                'DROP_DOWN' => 'dropdown',
                default => 'radio',
            };

            $normalized['options'] = collect($choice['options'] ?? [])
                ->map(fn ($option) => ! empty($option['isOther']) ? 'Other' : ($option['value'] ?? ''))
                ->all();
        } elseif (isset($question['textQuestion'])) {
            $normalized['type'] = ! empty($question['textQuestion']['paragraph']) ? 'paragraph' : 'text';
        } elseif (isset($question['scaleQuestion'])) {
            $scale = $question['scaleQuestion'];

            $normalized['type'] = 'scale';
            $normalized['scale'] = [
                'low' => $scale['low'] ?? 1,
                'high' => $scale['high'] ?? 5,
                'low_label' => $scale['lowLabel'] ?? null,
                'high_label' => $scale['highLabel'] ?? null,
            ];
        } elseif (isset($question['dateQuestion'])) {
            $normalized['type'] = 'date';
        } elseif (isset($question['timeQuestion'])) {
            $normalized['type'] = 'time';
        } elseif (isset($question['fileUploadQuestion'])) {
            $normalized['type'] = 'file';
        }

        return $normalized;
    }

    private function normalizeResponse(array $response): array
    {
        $answers = [];

        foreach ($response['answers'] ?? [] as $questionId => $answer) {
            if (isset($answer['textAnswers']['answers'])) {
                $answers[$questionId] = collect($answer['textAnswers']['answers'])
                    ->pluck('value')
                    ->all();
            } elseif (isset($answer['fileUploadAnswers']['answers'])) {
                $answers[$questionId] = collect($answer['fileUploadAnswers']['answers'])
                    ->pluck('fileName')
                    ->all();
            }
        }

        return [
            'id' => $response['responseId'],
            'submitted_at' => $response['lastSubmittedTime'] ?? $response['createTime'] ?? null,
            'email' => $response['respondentEmail'] ?? null,
            'answers' => $answers,
        ];
    }

    // ---------------------------------------------------------------
    // HTTP helpers
    // ---------------------------------------------------------------

    private function get(GoogleAccount $account, string $url, array $query = []): array
    {
        $token = $this->tokens->accessTokenFor($account);

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout(30)
                ->get($url, $query);
        } catch (ConnectionException $e) {
            throw new GoogleApiException('Could not reach Google. Please try again.', 502, 'google_unreachable');
        }

        if ($response->failed()) {
            throw $this->toException($response);
        }

        return $response->json() ?? [];
    }

    private function toException(Response $response): GoogleApiException
    {
        $googleMessage = $response->json('error.message');

        return match ($response->status()) {
            401 => new GoogleApiException('Google connection expired. Please reconnect.', 409, 'google_reconnect'),
            403 => new GoogleApiException($googleMessage ?: 'Google denied access to this resource.', 403, 'google_forbidden'),
            404 => new GoogleApiException('Form not found, or you do not have access to it.', 404, 'form_not_found'),
            429 => new GoogleApiException('Google rate limit reached. Please wait a moment and try again.', 429, 'google_rate_limited'),
            default => new GoogleApiException($googleMessage ?: 'Google returned an error.', 502, 'google_error'),
        };
    }
}

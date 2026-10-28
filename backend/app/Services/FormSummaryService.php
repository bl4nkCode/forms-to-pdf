<?php

namespace App\Services;

use Illuminate\Support\Str;

class FormSummaryService
{
    private const CHOICE_TYPES = ['radio', 'checkbox', 'dropdown', 'grid'];

    /**
     * @param  array  $form    Normalized form from GoogleFormsService::getForm()
     * @param  array  $result  Result of GoogleFormsService::getResponses()
     */
    public function build(array $form, array $result): array
    {
        $responses = $result['responses'];
        $dates = collect($responses)->pluck('submitted_at')->filter()->sort()->values();

        return [
            'response_count' => count($responses),
            'truncated' => $result['truncated'],
            'first_submitted_at' => $dates->first(),
            'last_submitted_at' => $dates->last(),
            'questions' => $this->summarizeQuestions($form['items'], $responses),
        ];
    }

    private function summarizeQuestions(array $items, array $responses): array
    {
        $questions = [];

        foreach ($items as $item) {
            if ($item['kind'] === 'question') {
                $questions[] = $this->summarizeQuestion($item, $responses);
            }
        }

        return $questions;
    }

    private function summarizeQuestion(array $item, array $responses): array
    {
        // One list of non-empty values for every response that answered this question
        $answers = [];

        foreach ($responses as $response) {
            $values = array_values(array_filter(
                $response['answers'][$item['id']] ?? [],
                fn ($value) => trim((string) $value) !== ''
            ));

            if ($values) {
                $answers[] = $values;
            }
        }

        $summary = [
            'id' => $item['id'],
            'title' => $item['title'],
            'type' => $item['type'],
            'answered' => count($answers),
            'chart' => 'none',
            'options' => [],
            'average' => null,
            'samples' => [],
        ];

        if (in_array($item['type'], self::CHOICE_TYPES, true)) {
            $summary['chart'] = 'bar';
            $summary['options'] = $this->countOptions($item['options'], $answers);
        } elseif ($item['type'] === 'scale') {
            [$options, $average] = $this->countScale($item['scale'], $answers);

            $summary['chart'] = 'scale';
            $summary['options'] = $options;
            $summary['average'] = $average;
        } elseif (in_array($item['type'], ['text', 'paragraph'], true)) {
            $summary['chart'] = 'samples';
            $summary['samples'] = collect($answers)
                ->map(fn ($values) => Str::limit(implode(', ', $values), 200))
                ->take(-5)
                ->values()
                ->all();
        }

        return $summary;
    }

    private function countOptions(array $options, array $answers): array
    {
        $counts = [];

        foreach ($options as $option) {
            $counts[(string) $option] = 0;
        }

        foreach ($answers as $values) {
            foreach ($values as $value) {
                $key = (string) $value;

                if (array_key_exists($key, $counts)) {
                    $counts[$key]++;
                } else {
                    // Custom "Other" text, or an option that was later edited
                    $counts['Other'] = ($counts['Other'] ?? 0) + 1;
                }
            }
        }

        $answered = count($answers);

        return collect($counts)
            ->map(fn ($count, $label) => [
                'label' => (string) $label,
                'count' => $count,
                'percent' => $answered > 0 ? round($count / $answered * 100, 1) : 0,
            ])
            ->values()
            ->all();
    }

    private function countScale(array $scale, array $answers): array
    {
        $low = (int) $scale['low'];
        $high = max($low, (int) $scale['high']);
        $counts = array_fill($low, $high - $low + 1, 0);

        $sum = 0;
        $valid = 0;

        foreach ($answers as $values) {
            $value = $values[0] ?? null;

            if (is_numeric($value) && isset($counts[(int) $value])) {
                $counts[(int) $value]++;
                $sum += (int) $value;
                $valid++;
            }
        }

        $options = [];

        foreach ($counts as $number => $count) {
            $options[] = [
                'label' => (string) $number,
                'count' => $count,
                'percent' => $valid > 0 ? round($count / $valid * 100, 1) : 0,
            ];
        }

        return [$options, $valid > 0 ? round($sum / $valid, 2) : null];
    }
}

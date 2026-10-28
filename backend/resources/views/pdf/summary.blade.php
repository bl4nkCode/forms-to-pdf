<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $form['title'] }} - Summary</title>
    <style>
        @page { margin: 50px 50px 60px 50px; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1e293b;
        }

        h1 { font-size: 22px; margin: 0 0 4px 0; color: #3730a3; }
        .sub { color: #64748b; margin-bottom: 14px; }
        .notice {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            color: #92400e;
            padding: 6px 10px;
            margin-bottom: 12px;
        }

        table.stats { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin: 0 -6px 18px -6px; }
        table.stats td {
            background: #eef2ff;
            border: 1px solid #c7d2fe;
            padding: 8px 10px;
            text-align: center;
            width: 25%;
        }
        .stat-num { font-size: 18px; font-weight: bold; color: #3730a3; }
        .stat-label { font-size: 9px; color: #64748b; margin-top: 2px; }

        .card {
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        .q-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
        .q-meta { font-size: 10px; color: #94a3b8; margin-bottom: 8px; }
        .avg { font-size: 11px; font-weight: bold; color: #3730a3; margin-bottom: 6px; }
        .muted { color: #94a3b8; font-style: italic; }

        table.row { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 3px; }
        table.row td { padding: 1px 0; vertical-align: middle; }
        td.lbl { width: 34%; padding-right: 8px; font-size: 10px; }
        td.bar { width: 42%; }
        td.val { width: 24%; padding-left: 8px; font-size: 10px; color: #475569; }

        table.track { width: 100%; border-collapse: collapse; table-layout: fixed; }
        td.fill { background: #6366f1; height: 11px; line-height: 11px; font-size: 1px; padding: 0; }
        td.rest { background: #e0e7ff; height: 11px; line-height: 11px; font-size: 1px; padding: 0; }

        .samples-title { font-size: 10px; color: #64748b; margin-bottom: 4px; }
        .sample {
            border-left: 3px solid #c7d2fe;
            padding-left: 8px;
            margin-bottom: 4px;
        }

        .footer {
            position: fixed;
            bottom: -35px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
        .pagenum:before { content: counter(page); }
    </style>
</head>
<body>
    @php
        $typeLabels = [
            'text' => 'Short answer',
            'paragraph' => 'Paragraph',
            'radio' => 'Multiple choice',
            'checkbox' => 'Checkboxes',
            'dropdown' => 'Dropdown',
            'scale' => 'Linear scale',
            'date' => 'Date',
            'time' => 'Time',
            'file' => 'File upload',
            'grid' => 'Grid',
        ];
        $showSamples = $settings['text_samples'] ?? true;
    @endphp

    <div class="footer">{{ $form['title'] }} &nbsp;|&nbsp; Page <span class="pagenum"></span></div>

    <h1>{{ $form['title'] }}</h1>
    <div class="sub">Response summary</div>

    @if ($summary['truncated'])
        <div class="notice">This summary is based on the first {{ $summary['response_count'] }} responses.</div>
    @endif

    <table class="stats">
        <tr>
            <td>
                <div class="stat-num">{{ $summary['response_count'] }}</div>
                <div class="stat-label">RESPONSES</div>
            </td>
            <td>
                <div class="stat-num">{{ count($summary['questions']) }}</div>
                <div class="stat-label">QUESTIONS</div>
            </td>
            <td>
                <div class="stat-num" style="font-size: 12px;">{{ $firstSubmitted }}</div>
                <div class="stat-label">FIRST RESPONSE</div>
            </td>
            <td>
                <div class="stat-num" style="font-size: 12px;">{{ $lastSubmitted }}</div>
                <div class="stat-label">LATEST RESPONSE</div>
            </td>
        </tr>
    </table>

    @foreach ($summary['questions'] as $q)
        <div class="card">
            <div class="q-title">{{ $loop->iteration }}. {{ $q['title'] ?: 'Untitled question' }}</div>
            <div class="q-meta">
                {{ $typeLabels[$q['type']] ?? $q['type'] }}
                &middot; {{ $q['answered'] }} of {{ $summary['response_count'] }} answered
            </div>

            @if (in_array($q['chart'], ['bar', 'scale']))
                @if ($q['chart'] === 'scale' && $q['average'] !== null)
                    <div class="avg">Average: {{ $q['average'] }}</div>
                @endif

                @foreach ($q['options'] as $option)
                    <table class="row">
                        <tr>
                            <td class="lbl">{{ $option['label'] }}</td>
                            <td class="bar">
                                <table class="track">
                                    <tr>
                                        @if ($option['percent'] > 0)
                                            <td class="fill" style="width: {{ $option['percent'] }}%;">&nbsp;</td>
                                        @endif
                                        <td class="rest">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                            <td class="val">{{ $option['count'] }} ({{ $option['percent'] }}%)</td>
                        </tr>
                    </table>
                @endforeach

            @elseif ($q['chart'] === 'samples')
                @if (! $showSamples)
                    <div class="muted">Text answers are not included in this summary.</div>
                @elseif (count($q['samples']) === 0)
                    <div class="muted">No answers yet.</div>
                @else
                    <div class="samples-title">Latest answers</div>
                    @foreach ($q['samples'] as $sample)
                        <div class="sample">{{ $sample }}</div>
                    @endforeach
                @endif

            @else
                <div class="muted">No chart for this question type.</div>
            @endif
        </div>
    @endforeach
</body>
</html>

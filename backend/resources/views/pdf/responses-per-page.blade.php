<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $form['title'] }} - Responses</title>
    <style>
        @page { margin: 50px 50px 60px 50px; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #1e293b;
        }

        h1 { font-size: 20px; margin: 0 0 4px 0; color: #3730a3; }
        .notice {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            color: #92400e;
            padding: 6px 10px;
            margin: 6px 0 12px 0;
            font-size: 11px;
        }

        .response-header {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 6px;
            margin-bottom: 14px;
        }
        .response-title { font-size: 15px; font-weight: bold; color: #3730a3; }
        .meta { font-size: 11px; color: #64748b; margin-top: 2px; }

        .section {
            font-size: 13px;
            font-weight: bold;
            color: #475569;
            margin: 16px 0 8px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
        }

        .qa { margin-bottom: 12px; page-break-inside: avoid; }
        .q { font-weight: bold; margin-bottom: 3px; }
        .a { margin-left: 8px; padding-left: 8px; border-left: 3px solid #c7d2fe; margin-bottom: 2px; }
        .none { margin-left: 8px; color: #94a3b8; font-style: italic; }

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
    <div class="footer">{{ $form['title'] }} &nbsp;|&nbsp; Page <span class="pagenum"></span></div>

    @foreach ($rows as $row)
        <div @if (! $loop->last) style="page-break-after: always;" @endif>

            @if ($loop->first)
                <h1>{{ $form['title'] }}</h1>
                @if ($notice)
                    <div class="notice">{{ $notice }}</div>
                @endif
            @endif

            <div class="response-header">
                <div class="response-title">Response {{ $row['number'] }} of {{ count($rows) }}</div>
                <div class="meta">
                    Submitted {{ $row['submitted'] }}
                    @if (! empty($row['email']))
                        &nbsp;|&nbsp; {{ $row['email'] }}
                    @endif
                </div>
            </div>

            @foreach ($form['items'] as $item)
                @if ($item['kind'] === 'section')
                    <div class="section">{{ $item['title'] ?: 'Section' }}</div>
                @elseif ($item['kind'] === 'question')
                    @php $values = $row['answers'][$item['id']] ?? []; @endphp

                    <div class="qa">
                        <div class="q">{{ $item['title'] ?: 'Untitled question' }}</div>

                        @if (count($values) === 0)
                            <div class="none">No answer</div>
                        @elseif (count($values) === 1)
                            <div class="a">{!! nl2br(e($values[0])) !!}</div>
                        @else
                            @foreach ($values as $value)
                                <div class="a">&bull; {{ $value }}</div>
                            @endforeach
                        @endif
                    </div>
                @endif
            @endforeach
        </div>
    @endforeach
</body>
</html>

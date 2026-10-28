<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $form['title'] }} - Responses</title>
    <style>
        @page { margin: 40px 36px 50px 36px; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1e293b;
        }

        h1 { font-size: 20px; margin: 0 0 4px 0; color: #3730a3; }
        h2 { font-size: 12px; margin: 0 0 8px 0; color: #475569; }
        .sub { color: #64748b; margin-bottom: 10px; }
        .notice {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            color: #92400e;
            padding: 5px 8px;
            margin-bottom: 10px;
        }

        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 4px 5px;
            font-size: 9px;
            vertical-align: top;
            word-wrap: break-word;
        }
        th { background: #eef2ff; text-align: left; color: #3730a3; }
        tr.even td { background: #f8fafc; }
        .col-num { width: 24px; }
        .col-when { width: 82px; }
        .col-email { width: 110px; }

        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }
        .pagenum:before { content: counter(page); }
    </style>
</head>
<body>
    <div class="footer">{{ $form['title'] }} &nbsp;|&nbsp; Page <span class="pagenum"></span></div>

    @php
        $chunks = collect($questions)->chunk($columnsPerTable);
        $hasEmail = collect($rows)->contains(fn ($row) => ! empty($row['email']));
    @endphp

    <h1>{{ $form['title'] }}</h1>
    <div class="sub">Responses: {{ count($rows) }} shown</div>

    @if ($notice)
        <div class="notice">{{ $notice }}</div>
    @endif

    @foreach ($chunks as $chunk)
        <div @if (! $loop->first) style="page-break-before: always;" @endif>
            @if ($chunks->count() > 1)
                <h2>Questions {{ $chunk->keys()->first() + 1 }} to {{ $chunk->keys()->last() + 1 }} of {{ count($questions) }}</h2>
            @endif

            <table>
                <thead>
                    <tr>
                        <th class="col-num">#</th>
                        <th class="col-when">Submitted</th>
                        @if ($hasEmail)
                            <th class="col-email">Email</th>
                        @endif
                        @foreach ($chunk as $question)
                            <th>{{ $question['title'] ?: 'Untitled question' }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach ($rows as $row)
                        <tr class="{{ $loop->even ? 'even' : '' }}">
                            <td>{{ $row['number'] }}</td>
                            <td>{{ $row['submitted'] }}</td>
                            @if ($hasEmail)
                                <td>{{ $row['email'] }}</td>
                            @endif
                            @foreach ($chunk as $question)
                                <td>{{ implode(', ', $row['answers'][$question['id']] ?? []) }}</td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endforeach
</body>
</html>

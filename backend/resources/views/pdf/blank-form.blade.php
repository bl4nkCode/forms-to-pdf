<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $form['title'] }}</title>
    <style>
        @page { margin: 50px 50px 60px 50px; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #1e293b;
        }

        h1 { font-size: 22px; margin: 0 0 6px 0; color: #3730a3; }
        .description { color: #475569; margin: 0 0 16px 0; }

        .section {
            font-size: 16px;
            font-weight: bold;
            color: #3730a3;
            margin: 0 0 6px 0;
            padding-bottom: 4px;
            border-bottom: 2px solid #4f46e5;
        }

        .text-block { margin: 0 0 14px 0; color: #475569; }

        .question { margin: 0 0 18px 0; page-break-inside: avoid; }
        .q-title { font-size: 13px; font-weight: bold; margin-bottom: 3px; }
        .q-desc { color: #64748b; font-size: 11px; margin-bottom: 5px; }
        .req { color: #dc2626; }

        .option { margin: 4px 0 4px 6px; }
        .mark {
            display: inline-block;
            width: 11px;
            height: 11px;
            border: 1px solid #475569;
            margin-right: 7px;
            vertical-align: middle;
        }
        .mark.round { border-radius: 50%; }

        .line { border-bottom: 1px solid #94a3b8; height: 22px; margin-top: 4px; }
        .blank-inline {
            display: inline-block;
            border-bottom: 1px solid #94a3b8;
            width: 120px;
            height: 12px;
        }
        .hint { color: #94a3b8; font-size: 11px; margin-top: 4px; }

        table.scale { border-collapse: collapse; margin-top: 6px; }
        table.scale td { text-align: center; padding: 0 7px; vertical-align: middle; }
        .scale-num { font-size: 11px; margin-bottom: 3px; }
        .scale-label { font-size: 10px; color: #64748b; }

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

    <h1>{{ $form['title'] }}</h1>
    @if (! empty($form['description']))
        <div class="description">{!! nl2br(e($form['description'])) !!}</div>
    @endif

    @php
        $number = 0;
        $answerLines = $settings['answer_lines'] ?? true;
    @endphp

    @foreach ($form['items'] as $item)

        @if ($item['kind'] === 'section')
            <div class="section" @if (! $loop->first) style="page-break-before: always;" @endif>
                {{ $item['title'] ?: 'Section' }}
            </div>
            @if (! empty($item['description']))
                <div class="description">{!! nl2br(e($item['description'])) !!}</div>
            @endif

        @elseif ($item['kind'] === 'text')
            <div class="text-block">
                @if (! empty($item['title']))
                    <strong>{{ $item['title'] }}</strong><br>
                @endif
                @if (! empty($item['description']))
                    {!! nl2br(e($item['description'])) !!}
                @endif
            </div>

        @else
            @php
                $number++;
                $type = $item['type'];
                $round = in_array($type, ['radio', 'dropdown'])
                    || ($type === 'grid' && empty($item['multiple']));
            @endphp

            <div class="question">
                <div class="q-title">
                    {{ $number }}. {{ $item['title'] ?: 'Untitled question' }}
                    @if ($item['required'])<span class="req">*</span>@endif
                </div>

                @if (! empty($item['description']))
                    <div class="q-desc">{!! nl2br(e($item['description'])) !!}</div>
                @endif

                @if (in_array($type, ['radio', 'checkbox', 'dropdown', 'grid']))
                    @foreach ($item['options'] as $option)
                        <div class="option">
                            <span class="mark {{ $round ? 'round' : '' }}"></span>
                            @if ($option === 'Other')
                                Other: <span class="blank-inline"></span>
                            @else
                                {{ $option }}
                            @endif
                        </div>
                    @endforeach

                @elseif ($type === 'scale')
                    <table class="scale">
                        <tr>
                            @if (! empty($item['scale']['low_label']))
                                <td class="scale-label">{{ $item['scale']['low_label'] }}</td>
                            @endif
                            @for ($i = $item['scale']['low']; $i <= $item['scale']['high']; $i++)
                                <td>
                                    <div class="scale-num">{{ $i }}</div>
                                    <span class="mark round" style="margin-right: 0;"></span>
                                </td>
                            @endfor
                            @if (! empty($item['scale']['high_label']))
                                <td class="scale-label">{{ $item['scale']['high_label'] }}</td>
                            @endif
                        </tr>
                    </table>

                @elseif ($type === 'paragraph')
                    @if ($answerLines)
                        @for ($i = 0; $i < 4; $i++)<div class="line"></div>@endfor
                    @else
                        <div class="hint">Paragraph answer</div>
                    @endif

                @elseif ($type === 'date')
                    @if ($answerLines)
                        <div style="margin-top: 6px;">
                            Month <span class="blank-inline" style="width: 40px;"></span>
                            Day <span class="blank-inline" style="width: 40px;"></span>
                            Year <span class="blank-inline" style="width: 60px;"></span>
                        </div>
                    @else
                        <div class="hint">Date</div>
                    @endif

                @elseif ($type === 'time')
                    @if ($answerLines)
                        <div style="margin-top: 6px;">
                            Hour <span class="blank-inline" style="width: 40px;"></span>
                            Minute <span class="blank-inline" style="width: 40px;"></span>
                        </div>
                    @else
                        <div class="hint">Time</div>
                    @endif

                @elseif ($type === 'file')
                    <div class="hint">File upload (available in the online form only)</div>

                @else
                    @if ($answerLines)
                        <div class="line"></div>
                    @else
                        <div class="hint">Short answer</div>
                    @endif
                @endif
            </div>
        @endif

    @endforeach
</body>
</html>

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Export extends Model
{
    protected $fillable = [
        'user_id',
        'google_form_id',
        'form_title',
        'type',
        'options',
        'status',
        'file_path',
        'error_message',
    ];

    // Never expose the server path to the browser
    protected $hidden = ['file_path'];

    protected $appends = ['filename'];

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }

    // e.g. "test-survey-blank.pdf"
    protected function filename(): Attribute
    {
        return Attribute::get(function () {
            $slug = Str::slug($this->form_title) ?: 'form';

            return "{$slug}-{$this->type}.pdf";
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

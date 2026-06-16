<?php

namespace App\Http\Requests;

use App\Models\Poll;
use Illuminate\Foundation\Http\FormRequest;

class StorePollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Poll::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:500'],
            'allow_multiple' => ['boolean'],
            // Optional access gate (D9): blank = open poll.
            'access_password' => ['nullable', 'string', 'min:1', 'max:100'],
            // End mode: relative countdown OR an absolute deadline date/time (D7).
            'end_mode' => ['required', 'in:duration,deadline'],
            'duration_seconds' => ['required_if:end_mode,duration', 'nullable', 'integer', 'in:45,90,120,180'],
            'deadline_at' => ['required_if:end_mode,deadline', 'nullable', 'date', 'after:now'],
            'launch' => ['boolean'],
            'options' => ['required', 'array', 'min:2', 'max:10'],
            'options.*.label' => ['required', 'string', 'max:120'],
            'options.*.color_class' => ['nullable', 'string', 'max:60'],
            'options.*.badge_color_class' => ['nullable', 'string', 'max:120'],
            'options.*.icon' => ['nullable', 'string', 'max:40'],
            // Uploaded option image (D10/D10a): explicit MIME allowlist (SVG excluded), 8 MB cap.
            'options.*.image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ];
    }
}

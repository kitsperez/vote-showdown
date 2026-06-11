<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePollRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Owning creator or super-admin (PollPolicy@update).
        return $this->user()->can('update', $this->route('poll'));
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
            // Blank = keep the existing password (or stay open). New value re-sets it.
            'access_password' => ['nullable', 'string', 'min:1', 'max:100'],
            'end_mode' => ['required', 'in:duration,deadline'],
            'duration_seconds' => ['required_if:end_mode,duration', 'nullable', 'integer', 'in:45,90,120,180'],
            'deadline_at' => ['required_if:end_mode,deadline', 'nullable', 'date', 'after:now'],
            'options' => ['required', 'array', 'min:2', 'max:10'],
            'options.*.id' => ['nullable', 'integer'],
            'options.*.label' => ['required', 'string', 'max:120'],
            'options.*.color_class' => ['nullable', 'string', 'max:60'],
            'options.*.badge_color_class' => ['nullable', 'string', 'max:120'],
            'options.*.icon' => ['nullable', 'string', 'max:40'],
            'options.*.image' => ['nullable', 'image', 'max:2048'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuestVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public endpoint; poll-state & dedupe enforced in the service/controller
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $poll = $this->route('poll');

        return [
            'email' => ['required', 'email', 'max:160'],
            'name' => ['nullable', 'string', 'max:80'],
            'poll_option_id' => [
                'required',
                'integer',
                Rule::exists('poll_options', 'id')->where('poll_id', $poll?->id),
            ],
        ];
    }
}

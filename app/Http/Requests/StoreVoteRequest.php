<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // real authorization happens via VotePolicy in the controller
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $poll = $this->route('poll');

        return [
            'poll_option_id' => [
                'required',
                'integer',
                Rule::exists('poll_options', 'id')->where('poll_id', $poll?->id),
            ],
        ];
    }
}

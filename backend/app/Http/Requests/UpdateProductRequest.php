<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use App\Traits\HandlesBase64Image;

class UpdateProductRequest extends FormRequest
{
    use HandlesBase64Image;
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['sometimes', 'nullable', 'array'],
            'image.base64' => ['required_with:image', 'string'],
            'image.filename' => ['required_with:image', 'string', 'max:255'],
            'image_binary' => ['nullable'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $this->validateAndMergeImage($validator);
    }
}

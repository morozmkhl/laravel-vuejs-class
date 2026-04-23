<?php

namespace App\Traits;

use Illuminate\Validation\Validator;
/**
 * @mixin \Illuminate\Foundation\Http\FormRequest
 */
trait HandlesBase64Image
{
    public function validateAndMergeImage(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty() || ! $this->filled('image')) {
                return;
            }

            $image = $this->input('image', []);

            $raw = (string) $this->input('image.base64', '');
            $payload = str_contains($raw, ',') ? explode(',', $raw, 2)[1] : $raw;
            $binary = base64_decode($payload, true);

            if ($binary === false || $binary === '' || @getimagesizefromstring($binary) === false) {
                $validator->errors()->add('image.base64', 'Файл не является допустимым изображением.');
            }

            $this->merge(['image_binary' => $binary]);

            $validator->setData(array_merge($validator->getData(), ['image_binary' => $binary]));
        });
    }
}

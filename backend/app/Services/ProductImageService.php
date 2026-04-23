<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    public function storeBinary(string $binary, string $filename): string
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION) ?: 'bin');
        $path = 'products/'.Str::uuid()->toString().'.'.$ext;

        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    public function deleteIfExists(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    private function payload(string $base64): string
    {
        $base64 = trim($base64);

        return str_contains($base64, ',') ? explode(',', $base64, 2)[1] : $base64;
    }
}

<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Services\ProductImageService;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class ProductSeeder extends Seeder
{
    /**
     * Минимальный валидный PNG 1×1 (запасной вариант без сети).
     */
    private const FALLBACK_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    public function run(ProductImageService $imageService): void
    {
        $faker = Factory::create('ru_RU');

        for ($i = 0; $i < 30; $i++) {
            $id = $i + 1;
            $url = "https://picsum.photos/id/{$id}/800/600";
            $binary = $this->fetchImage($url);
            $filename = "seed-product-{$id}.jpg";
            if ($binary === null) {
                $binary = base64_decode(self::FALLBACK_PNG);
                $filename = "seed-product-{$id}.png";
            }
            $path = $imageService->storeBinary($binary, $filename);

            Product::query()->create([
                'name' => "Товар {$id}: {$faker->words(3, true)}",
                'description' => $faker->optional(0.85)->paragraph(),
                'price' => $faker->randomFloat(2, 99, 99_999),
                'image_path' => $path,
            ]);
        }
    }

    private function fetchImage(string $url): ?string
    {
        try {
            $response = Http::timeout(20)->get($url);
            if ($response->successful() && strlen($response->body()) > 200) {
                return $response->body();
            }
        } catch (\Throwable) {
        }

        return null;
    }
}

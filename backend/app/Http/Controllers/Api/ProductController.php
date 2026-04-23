<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductImageService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()->latest()->get();

        return ProductResource::collection($products)->response();
    }

    public function store(StoreProductRequest $request, ProductImageService $images): JsonResponse
    {
        $data = $request->validated();
        $path = $images->storeBinary($data['image_binary'], $data['image']['filename']);

        $product = Product::query()->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'image_path' => $path,
        ]);

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function show(Product $product): JsonResponse
    {
        return (new ProductResource($product))->response();
    }

    public function update(UpdateProductRequest $request, Product $product, ProductImageService $images): JsonResponse
    {
        $data = $request->validated();

        $product->fill([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
        ]);

        if (! empty($data['image'])) {
            $images->deleteIfExists($product->image_path);
            $product->image_path = $images->storeBinary($data['image_binary'], $data['image']['filename']);
        }

        $product->save();

        return (new ProductResource($product->fresh()))->response();
    }

    public function destroy(Product $product, ProductImageService $images): JsonResponse
    {
        $images->deleteIfExists($product->image_path);
        $product->delete();

        return response()->json([
            'data' => ['deleted' => true],
        ]);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'path',
        'image_path',
    ];

    protected function casts(): array
    {
        return [
          'price' => 'decimal:2'
        ];
    }
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }
}

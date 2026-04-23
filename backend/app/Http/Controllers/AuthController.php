<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $credentials = $request->safe()->only(['email', 'password']);
        if(!Auth::attempt($credentials)){
            throw ValidationException::withMessages([
                'email' => ['Неверная почта или пароль'],
            ]);
        }

        $user = Auth::user();
        $user->tokens()->delete();
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $token,]
            ]);
    }

    public function register(RegisterRequest $request)
    {
        $data = $request->validated();
        $user = User::create($data);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $token]
            ], status: 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'data' => [
            'message' => 'Успешный выход из аккаунта',
            ]
        ]);
    }
}

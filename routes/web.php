<?php

use App\Http\Controllers\AngularController;
use App\Http\Controllers\FileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('view/{path}', [FileController::class, 'viewFile'])
    ->name('file.view');

Route::any('/{any}', [AngularController::class, 'index'])
    ->where('any', '^(?!api).*$');

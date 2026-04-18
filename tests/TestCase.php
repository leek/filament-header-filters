<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters\Tests;

use Leek\FilamentHeaderFilters\FilamentHeaderFiltersServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [
            FilamentHeaderFiltersServiceProvider::class,
        ];
    }
}

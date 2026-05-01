<?php

declare(strict_types=1);

namespace Leek\FilamentHeaderFilters;

use Illuminate\Contracts\Foundation\Application;
use Leek\FilamentHeaderFilters\Macros\RegisterMacros;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class FilamentHeaderFiltersServiceProvider extends PackageServiceProvider
{
    public static string $name = 'filament-header-filters';

    public function configurePackage(Package $package): void
    {
        $package
            ->name(static::$name)
            ->hasViews('filament-header-filters');
    }

    public function packageBooted(): void
    {
        RegisterMacros::register();

        $this->prependFilamentTableView();
    }

    protected function prependFilamentTableView(): void
    {
        $this->callAfterResolving('view', function ($view, Application $app): void {
            $viewsPath = __DIR__.'/../resources/views/vendor/filament-tables';

            if (is_dir($viewsPath)) {
                $view->prependNamespace('filament-tables', $viewsPath);
            }
        });
    }
}

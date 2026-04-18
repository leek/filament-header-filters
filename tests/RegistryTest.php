<?php

declare(strict_types=1);

use Leek\FilamentHeaderFilters\Support\HeaderFilterRegistry;

it('stores and retrieves column-to-filter bindings without leaking types', function (): void {
    expect(class_exists(HeaderFilterRegistry::class))->toBeTrue();

    expect(method_exists(HeaderFilterRegistry::class, 'setColumnFilter'))->toBeTrue();
    expect(method_exists(HeaderFilterRegistry::class, 'getColumnFilter'))->toBeTrue();
    expect(method_exists(HeaderFilterRegistry::class, 'hasColumnFilter'))->toBeTrue();
});

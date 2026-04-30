@props([
    'column',
])

@php
    $filter = $column->getHeaderFilter();
    $filterName = $filter->getName();
@endphp

<div
    {{ $attributes->class(['fi-ta-header-filter']) }}
>
    {{ \Leek\FilamentHeaderFilters\Support\HeaderFilters::form($this)->getComponent($filterName)?->getChildSchema() }}
</div>

<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class CommaSeparatedArray implements ValidationRule
{

    private array $arrayCheck;

    public function __construct(array $arrayCheck = [])
    {
        $this->arrayCheck = $arrayCheck;
    }

    /**
     * Run the validation rule.
     *
     * @param Closure(string): PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {

        $values = gettype($value) === 'string' ? explode(',', $value) : $value;

        foreach ($values as $val) {
            if (!in_array($val, $this->arrayCheck)) {
                $fail(__('messages.in', ['attribute' => $attribute]));
            }
        }
    }
}

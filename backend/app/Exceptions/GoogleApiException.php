<?php

namespace App\Exceptions;

use RuntimeException;

class GoogleApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public int $status = 502,
        public string $errorCode = 'google_error',
    ) {
        parent::__construct($message);
    }
}

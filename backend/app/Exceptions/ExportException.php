<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * An export problem whose message is safe to show to the user.
 */
class ExportException extends RuntimeException
{
}

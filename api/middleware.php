<?php

declare(strict_types=1);

/**
 * Extract and verify the authenticated user from the Authorization header.
 * Returns the JWT payload (containing user_id, email, name) or null.
 */
function getAuthUser(): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!str_starts_with($header, 'Bearer ')) {
        return null;
    }

    $token = substr($header, 7);
    return verifyJwt($token);
}

/**
 * Require authentication. Sends 401 and exits if not authenticated.
 * Returns the authenticated user payload.
 */
function requireAuth(): array
{
    $user = getAuthUser();

    if ($user === null) {
        sendJson(['error' => 'Unauthorized'], 401);
        exit;
    }

    return $user;
}

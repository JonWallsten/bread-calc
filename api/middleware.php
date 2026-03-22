<?php

declare(strict_types=1);

/**
 * Extract and verify the authenticated user from the auth cookie.
 * Returns the JWT payload (containing user_id, email) or null.
 */
function getAuthUser(): ?array
{
    $token = $_COOKIE['auth_token'] ?? null;

    if ($token === null) {
        return null;
    }

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

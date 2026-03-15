<?php

/**
 * Router for PHP's built-in development server.
 * Usage: php -S localhost:8080 api/router.php
 *
 * Rewrites requests to index.php (mimicking the .htaccess rules)
 * and sets REQUEST_URI so the app's basePath stripping works correctly.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve existing files directly (uploads, etc.)
$file = __DIR__ . $uri;
if ($uri !== '/' && file_exists($file) && is_file($file)) {
    // Don't execute PHP files in uploads
    if (str_starts_with(realpath($file), realpath(__DIR__ . '/uploads'))) {
        $mime = mime_content_type($file);
        header("Content-Type: $mime");
        readfile($file);
        return true;
    }
    return false; // let PHP's built-in server handle it
}

// Rewrite: prepend /bread-calc/api so index.php's basePath stripping works
$_SERVER['REQUEST_URI'] = '/bread-calc/api' . $_SERVER['REQUEST_URI'];

require __DIR__ . '/index.php';

<?php

declare(strict_types=1);

// ─── Bootstrap ────────────────────────────────────────────
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/middleware.php';

// ─── CORS ─────────────────────────────────────────────────
$allowedOrigins = [
    'http://localhost:4200',
    'https://jonwallsten.com',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Helpers ──────────────────────────────────────────────
function sendJson(mixed $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

// ─── Parse route ──────────────────────────────────────────
$basePath = '/bread-calc/api';
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = substr($requestUri, strlen($basePath)) ?: '/';
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// ─── Route dispatch ───────────────────────────────────────
// Auth routes (public)
if (str_starts_with($path, '/auth')) {
    require_once __DIR__ . '/routes/auth.php';
    handleAuthRoutes($method, $path);
    exit;
}

// Public shared bake route (no auth)
if ($method === 'GET' && preg_match('#^/shared/([a-f0-9]{64})$#', $path, $m)) {
    require_once __DIR__ . '/routes/sessions.php';
    getSharedSession($m[1]);
    exit;
}

// All routes below require authentication
$authUser = requireAuth();

if (str_starts_with($path, '/recipes')) {
    require_once __DIR__ . '/routes/recipes.php';
    handleRecipeRoutes($method, $path, $authUser);
    exit;
}

if (str_starts_with($path, '/flour-blends')) {
    require_once __DIR__ . '/routes/flour-blends.php';
    handleFlourBlendRoutes($method, $path, $authUser);
    exit;
}

if (str_starts_with($path, '/sessions')) {
    require_once __DIR__ . '/routes/sessions.php';
    handleSessionRoutes($method, $path, $authUser);
    exit;
}

if (str_starts_with($path, '/compare')) {
    require_once __DIR__ . '/routes/compare.php';
    handleCompareRoutes($method, $authUser);
    exit;
}

sendJson(['error' => 'Not found'], 404);

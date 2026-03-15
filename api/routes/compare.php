<?php

declare(strict_types=1);

function handleCompareRoutes(string $method, array $authUser): void
{
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed'], 405);
        return;
    }

    $userId = (int)$authUser['user_id'];
    $idA = isset($_GET['a']) ? (int)$_GET['a'] : 0;
    $idB = isset($_GET['b']) ? (int)$_GET['b'] : 0;

    if ($idA === 0 || $idB === 0) {
        sendJson(['error' => 'Query params a and b (recipe IDs) are required'], 400);
        return;
    }

    $db = getDb();
    $stmt = $db->prepare(
        'SELECT id, name, inputs FROM recipes WHERE id IN (:a, :b) AND user_id = :uid'
    );
    $stmt->execute([':a' => $idA, ':b' => $idB, ':uid' => $userId]);
    $rows = $stmt->fetchAll();

    $recipes = [];
    foreach ($rows as $row) {
        $recipes[(int)$row['id']] = [
            'id'     => (int)$row['id'],
            'name'   => $row['name'],
            'inputs' => json_decode($row['inputs'], true),
        ];
    }

    if (!isset($recipes[$idA]) || !isset($recipes[$idB])) {
        sendJson(['error' => 'One or both recipes not found'], 404);
        return;
    }

    sendJson([
        'recipe_a' => $recipes[$idA],
        'recipe_b' => $recipes[$idB],
    ]);
}

<?php

declare(strict_types=1);

function handleRecipeRoutes(string $method, string $path, array $authUser): void
{
    $userId = (int)$authUser['user_id'];

    // GET /recipes — list all
    if ($method === 'GET' && $path === '/recipes') {
        listRecipes($userId);
        return;
    }

    // POST /recipes — create
    if ($method === 'POST' && $path === '/recipes') {
        createRecipe($userId);
        return;
    }

    // PUT /recipes/:id — update
    if ($method === 'PUT' && preg_match('#^/recipes/(\d+)$#', $path, $m)) {
        updateRecipe($userId, (int)$m[1]);
        return;
    }

    // DELETE /recipes/:id — delete
    if ($method === 'DELETE' && preg_match('#^/recipes/(\d+)$#', $path, $m)) {
        deleteRecipe($userId, (int)$m[1]);
        return;
    }

    sendJson(['error' => 'Not found'], 404);
}

function listRecipes(int $userId): void
{
    $db = getDb();
    $stmt = $db->prepare(
        'SELECT id, name, inputs, is_default, created_at, updated_at
         FROM recipes WHERE user_id = :uid ORDER BY updated_at DESC'
    );
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['id'] = (int)$row['id'];
        $row['is_default'] = (bool)$row['is_default'];
        $row['inputs'] = json_decode($row['inputs'], true);
    }

    sendJson($rows);
}

function createRecipe(int $userId): void
{
    $body = getJsonBody();
    $name = trim($body['name'] ?? '');
    $inputs = $body['inputs'] ?? null;

    if ($name === '' || !is_array($inputs)) {
        sendJson(['error' => 'name and inputs are required'], 400);
        return;
    }

    $db = getDb();
    $stmt = $db->prepare(
        'INSERT INTO recipes (user_id, name, inputs) VALUES (:uid, :name, :inputs)'
    );
    $stmt->execute([
        ':uid'    => $userId,
        ':name'   => $name,
        ':inputs' => json_encode($inputs),
    ]);

    $id = (int)$db->lastInsertId();
    sendJson(['recipe' => ['id' => $id, 'name' => $name, 'inputs' => $inputs]], 201);
}

function updateRecipe(int $userId, int $id): void
{
    $db = getDb();

    // Verify ownership
    $stmt = $db->prepare('SELECT id FROM recipes WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    if (!$stmt->fetch()) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    $body = getJsonBody();
    $sets = [];
    $params = [':id' => $id];

    if (isset($body['name'])) {
        $sets[] = 'name = :name';
        $params[':name'] = trim($body['name']);
    }
    if (isset($body['inputs']) && is_array($body['inputs'])) {
        $sets[] = 'inputs = :inputs';
        $params[':inputs'] = json_encode($body['inputs']);
    }
    if (isset($body['is_default'])) {
        // Clear other defaults first
        if ($body['is_default']) {
            $db->prepare('UPDATE recipes SET is_default = 0 WHERE user_id = :uid')
                ->execute([':uid' => $userId]);
        }
        $sets[] = 'is_default = :def';
        $params[':def'] = $body['is_default'] ? 1 : 0;
    }

    if (empty($sets)) {
        sendJson(['error' => 'Nothing to update'], 400);
        return;
    }

    $sql = 'UPDATE recipes SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $db->prepare($sql)->execute($params);

    sendJson(['success' => true]);
}

function deleteRecipe(int $userId, int $id): void
{
    $db = getDb();
    $stmt = $db->prepare('DELETE FROM recipes WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);

    if ($stmt->rowCount() === 0) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    sendJson(['success' => true]);
}

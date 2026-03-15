<?php

declare(strict_types=1);

function handleFlourBlendRoutes(string $method, string $path, array $authUser): void
{
    $userId = (int)$authUser['user_id'];

    if ($method === 'GET' && $path === '/flour-blends') {
        listFlourBlends($userId);
        return;
    }

    if ($method === 'POST' && $path === '/flour-blends') {
        createFlourBlend($userId);
        return;
    }

    if ($method === 'PUT' && preg_match('#^/flour-blends/(\d+)$#', $path, $m)) {
        updateFlourBlend($userId, (int)$m[1]);
        return;
    }

    if ($method === 'DELETE' && preg_match('#^/flour-blends/(\d+)$#', $path, $m)) {
        deleteFlourBlend($userId, (int)$m[1]);
        return;
    }

    sendJson(['error' => 'Not found'], 404);
}

function listFlourBlends(int $userId): void
{
    $db = getDb();
    $stmt = $db->prepare(
        'SELECT id, name, notes, flours, custom_hydration_adjustment, created_at, updated_at
         FROM flour_blends WHERE user_id = :uid ORDER BY updated_at DESC'
    );
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['id'] = (int)$row['id'];
        $row['flours'] = json_decode($row['flours'], true);
        $row['custom_hydration_adjustment'] = (float)$row['custom_hydration_adjustment'];
    }

    sendJson($rows);
}

function createFlourBlend(int $userId): void
{
    $body = getJsonBody();
    $name = trim($body['name'] ?? '');
    $flours = $body['flours'] ?? null;

    if ($name === '' || !is_array($flours)) {
        sendJson(['error' => 'name and flours are required'], 400);
        return;
    }

    $notes = trim($body['notes'] ?? '');
    $adjustment = (float)($body['custom_hydration_adjustment'] ?? 0);

    $db = getDb();
    $stmt = $db->prepare(
        'INSERT INTO flour_blends (user_id, name, notes, flours, custom_hydration_adjustment)
         VALUES (:uid, :name, :notes, :flours, :adj)'
    );
    $stmt->execute([
        ':uid'    => $userId,
        ':name'   => $name,
        ':notes'  => $notes,
        ':flours' => json_encode($flours),
        ':adj'    => $adjustment,
    ]);

    $id = (int)$db->lastInsertId();
    sendJson([
        'id'     => $id,
        'name'   => $name,
        'notes'  => $notes,
        'flours' => $flours,
        'custom_hydration_adjustment' => $adjustment,
    ], 201);
}

function updateFlourBlend(int $userId, int $id): void
{
    $db = getDb();

    $stmt = $db->prepare('SELECT id FROM flour_blends WHERE id = :id AND user_id = :uid');
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
    if (isset($body['notes'])) {
        $sets[] = 'notes = :notes';
        $params[':notes'] = trim($body['notes']);
    }
    if (isset($body['flours']) && is_array($body['flours'])) {
        $sets[] = 'flours = :flours';
        $params[':flours'] = json_encode($body['flours']);
    }
    if (isset($body['custom_hydration_adjustment'])) {
        $sets[] = 'custom_hydration_adjustment = :adj';
        $params[':adj'] = (float)$body['custom_hydration_adjustment'];
    }

    if (empty($sets)) {
        sendJson(['error' => 'Nothing to update'], 400);
        return;
    }

    $sql = 'UPDATE flour_blends SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $db->prepare($sql)->execute($params);

    sendJson(['success' => true]);
}

function deleteFlourBlend(int $userId, int $id): void
{
    $db = getDb();
    $stmt = $db->prepare('DELETE FROM flour_blends WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);

    if ($stmt->rowCount() === 0) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    sendJson(['success' => true]);
}

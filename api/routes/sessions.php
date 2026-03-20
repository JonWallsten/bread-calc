<?php

declare(strict_types=1);

function handleSessionRoutes(string $method, string $path, array $authUser): void
{
    $userId = (int)$authUser['user_id'];

    // Photo routes: POST /sessions/:id/photos, DELETE /sessions/:id/photos/:pid
    if (preg_match('#^/sessions/(\d+)/photos(?:/(\d+))?$#', $path, $m)) {
        $sessionId = (int)$m[1];
        $photoId = isset($m[2]) ? (int)$m[2] : null;

        if ($method === 'POST' && $photoId === null) {
            uploadPhoto($userId, $sessionId);
            return;
        }
        if ($method === 'DELETE' && $photoId !== null) {
            deletePhoto($userId, $sessionId, $photoId);
            return;
        }
        sendJson(['error' => 'Method not allowed'], 405);
        return;
    }

    // PUT /sessions/:id/share — toggle sharing
    if ($method === 'PUT' && preg_match('#^/sessions/(\d+)/share$#', $path, $m)) {
        toggleShareSession($userId, (int)$m[1]);
        return;
    }

    // GET /sessions — list
    if ($method === 'GET' && $path === '/sessions') {
        listSessions($userId);
        return;
    }

    // POST /sessions — create
    if ($method === 'POST' && $path === '/sessions') {
        createSession($userId);
        return;
    }

    // GET /sessions/:id — detail
    if ($method === 'GET' && preg_match('#^/sessions/(\d+)$#', $path, $m)) {
        getSession($userId, (int)$m[1]);
        return;
    }

    // PUT /sessions/:id — update
    if ($method === 'PUT' && preg_match('#^/sessions/(\d+)$#', $path, $m)) {
        updateSession($userId, (int)$m[1]);
        return;
    }

    // DELETE /sessions/:id — delete
    if ($method === 'DELETE' && preg_match('#^/sessions/(\d+)$#', $path, $m)) {
        deleteSession($userId, (int)$m[1]);
        return;
    }

    sendJson(['error' => 'Not found'], 404);
}

// ─── List sessions (paginated) ────────────────────────────
function listSessions(int $userId): void
{
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $db = getDb();

    // Total count
    $stmt = $db->prepare('SELECT COUNT(*) FROM baking_sessions WHERE user_id = :uid');
    $stmt->execute([':uid' => $userId]);
    $total = (int)$stmt->fetchColumn();

    // Sessions with first photo thumbnail
    $stmt = $db->prepare(
        'SELECT s.id, s.recipe_id, s.notes, s.rating, s.baked_at, s.created_at,
                r.name AS recipe_name,
                (SELECT sp.filename FROM session_photos sp WHERE sp.session_id = s.id ORDER BY sp.sort_order LIMIT 1) AS thumbnail
         FROM baking_sessions s
         LEFT JOIN recipes r ON r.id = s.recipe_id
         WHERE s.user_id = :uid
         ORDER BY s.baked_at DESC
         LIMIT :lim OFFSET :off'
    );
    $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['id'] = (int)$row['id'];
        $row['recipe_id'] = $row['recipe_id'] ? (int)$row['recipe_id'] : null;
        $row['rating'] = $row['rating'] ? (int)$row['rating'] : null;
    }

    sendJson([
        'sessions' => $rows,
        'total'    => $total,
        'page'     => $page,
        'pages'    => (int)ceil($total / $limit),
    ]);
}

// ─── Create session ───────────────────────────────────────
function createSession(int $userId): void
{
    $body = getJsonBody();
    $inputsSnapshot = $body['inputs_snapshot'] ?? null;
    $resultsSnapshot = $body['results_snapshot'] ?? null;

    if (!is_array($inputsSnapshot) || !is_array($resultsSnapshot)) {
        sendJson(['error' => 'inputs_snapshot and results_snapshot are required'], 400);
        return;
    }

    $recipeId = isset($body['recipe_id']) ? (int)$body['recipe_id'] : null;
    $notes = trim($body['notes'] ?? '');
    $rating = isset($body['rating']) ? (int)$body['rating'] : null;
    $bakedAt = $body['baked_at'] ?? date('Y-m-d H:i:s');

    if ($rating !== null && ($rating < 1 || $rating > 5)) {
        sendJson(['error' => 'Rating must be 1–5'], 400);
        return;
    }

    $db = getDb();
    $stmt = $db->prepare(
        'INSERT INTO baking_sessions (user_id, recipe_id, inputs_snapshot, results_snapshot, notes, rating, baked_at)
         VALUES (:uid, :rid, :inputs, :results, :notes, :rating, :baked)'
    );
    $stmt->execute([
        ':uid'     => $userId,
        ':rid'     => $recipeId,
        ':inputs'  => json_encode($inputsSnapshot),
        ':results' => json_encode($resultsSnapshot),
        ':notes'   => $notes,
        ':rating'  => $rating,
        ':baked'   => $bakedAt,
    ]);

    $id = (int)$db->lastInsertId();
    sendJson(['id' => $id], 201);
}

// ─── Get session detail ───────────────────────────────────
function getSession(int $userId, int $id): void
{
    $db = getDb();
    $stmt = $db->prepare(
        'SELECT s.*, r.name AS recipe_name
         FROM baking_sessions s
         LEFT JOIN recipes r ON r.id = s.recipe_id
         WHERE s.id = :id AND s.user_id = :uid'
    );
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    $session = $stmt->fetch();

    if (!$session) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    $session['id'] = (int)$session['id'];
    $session['user_id'] = (int)$session['user_id'];
    $session['recipe_id'] = $session['recipe_id'] ? (int)$session['recipe_id'] : null;
    $session['rating'] = $session['rating'] ? (int)$session['rating'] : null;
    $session['is_public'] = (bool)($session['is_public'] ?? false);
    $session['share_hash'] = $session['share_hash'] ?? null;
    $session['inputs_snapshot'] = json_decode($session['inputs_snapshot'], true);
    $session['results_snapshot'] = json_decode($session['results_snapshot'], true);

    // Photos
    $stmt = $db->prepare(
        'SELECT id, filename, original_name, sort_order FROM session_photos
         WHERE session_id = :sid ORDER BY sort_order'
    );
    $stmt->execute([':sid' => $id]);
    $photos = $stmt->fetchAll();
    foreach ($photos as &$p) {
        $p['id'] = (int)$p['id'];
        $p['sort_order'] = (int)$p['sort_order'];
    }

    $session['photos'] = $photos;
    sendJson($session);
}

// ─── Update session ───────────────────────────────────────
function updateSession(int $userId, int $id): void
{
    $db = getDb();
    $stmt = $db->prepare('SELECT id FROM baking_sessions WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    if (!$stmt->fetch()) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    $body = getJsonBody();
    $sets = [];
    $params = [':id' => $id];

    if (array_key_exists('notes', $body)) {
        $sets[] = 'notes = :notes';
        $params[':notes'] = trim($body['notes'] ?? '');
    }
    if (array_key_exists('rating', $body)) {
        $rating = $body['rating'] !== null ? (int)$body['rating'] : null;
        if ($rating !== null && ($rating < 1 || $rating > 5)) {
            sendJson(['error' => 'Rating must be 1–5'], 400);
            return;
        }
        $sets[] = 'rating = :rating';
        $params[':rating'] = $rating;
    }

    if (empty($sets)) {
        sendJson(['error' => 'Nothing to update'], 400);
        return;
    }

    $sql = 'UPDATE baking_sessions SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $db->prepare($sql)->execute($params);
    sendJson(['success' => true]);
}

// ─── Delete session + photos from disk ────────────────────
function deleteSession(int $userId, int $id): void
{
    $db = getDb();

    // Get photos to delete from disk
    $stmt = $db->prepare(
        'SELECT sp.filename FROM session_photos sp
         JOIN baking_sessions s ON s.id = sp.session_id
         WHERE sp.session_id = :sid AND s.user_id = :uid'
    );
    $stmt->execute([':sid' => $id, ':uid' => $userId]);
    $photos = $stmt->fetchAll();

    $stmt = $db->prepare('DELETE FROM baking_sessions WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);

    if ($stmt->rowCount() === 0) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    // Remove photo files
    foreach ($photos as $photo) {
        $filePath = UPLOADS_DIR . '/' . $photo['filename'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }

    sendJson(['success' => true]);
}

// ─── Upload photo ─────────────────────────────────────────
function uploadPhoto(int $userId, int $sessionId): void
{
    $db = getDb();

    // Verify session ownership
    $stmt = $db->prepare('SELECT id FROM baking_sessions WHERE id = :sid AND user_id = :uid');
    $stmt->execute([':sid' => $sessionId, ':uid' => $userId]);
    if (!$stmt->fetch()) {
        sendJson(['error' => 'Session not found'], 404);
        return;
    }

    // Check max 3 photos
    $stmt = $db->prepare('SELECT COUNT(*) FROM session_photos WHERE session_id = :sid');
    $stmt->execute([':sid' => $sessionId]);
    $count = (int)$stmt->fetchColumn();
    if ($count >= 3) {
        sendJson(['error' => 'Maximum 3 photos per session'], 400);
        return;
    }

    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        sendJson(['error' => 'No file uploaded or upload error'], 400);
        return;
    }

    $file = $_FILES['photo'];

    // Validate size (2 MB)
    if ($file['size'] > 2 * 1024 * 1024) {
        sendJson(['error' => 'File too large (max 2 MB)'], 400);
        return;
    }

    // Validate MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($mime, $allowedMimes, true)) {
        sendJson(['error' => 'Only JPEG, PNG, and WebP images are allowed'], 400);
        return;
    }

    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $ext = $extensions[$mime];
    $filename = $sessionId . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $destPath = UPLOADS_DIR . '/' . $filename;

    if (!is_dir(UPLOADS_DIR)) {
        mkdir(UPLOADS_DIR, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        sendJson(['error' => 'Failed to save file'], 500);
        return;
    }

    $originalName = $file['name'];

    $stmt = $db->prepare(
        'INSERT INTO session_photos (session_id, filename, original_name, sort_order)
         VALUES (:sid, :fname, :orig, :sort)'
    );
    $stmt->execute([
        ':sid'   => $sessionId,
        ':fname' => $filename,
        ':orig'  => $originalName,
        ':sort'  => $count, // Next sort_order
    ]);

    $photoId = (int)$db->lastInsertId();
    sendJson([
        'id'       => $photoId,
        'filename' => $filename,
        'sort_order' => $count,
    ], 201);
}

// ─── Delete single photo ──────────────────────────────────
function deletePhoto(int $userId, int $sessionId, int $photoId): void
{
    $db = getDb();

    // Verify ownership through session
    $stmt = $db->prepare(
        'SELECT sp.filename FROM session_photos sp
         JOIN baking_sessions s ON s.id = sp.session_id
         WHERE sp.id = :pid AND sp.session_id = :sid AND s.user_id = :uid'
    );
    $stmt->execute([':pid' => $photoId, ':sid' => $sessionId, ':uid' => $userId]);
    $photo = $stmt->fetch();

    if (!$photo) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    $db->prepare('DELETE FROM session_photos WHERE id = :pid')->execute([':pid' => $photoId]);

    $filePath = UPLOADS_DIR . '/' . $photo['filename'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    sendJson(['success' => true]);
}

// ─── Toggle session sharing ───────────────────────────────
function toggleShareSession(int $userId, int $id): void
{
    $db = getDb();
    $stmt = $db->prepare('SELECT id, is_public, share_hash FROM baking_sessions WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    $session = $stmt->fetch();

    if (!$session) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    $isPublic = (int)$session['is_public'];

    if ($isPublic) {
        // Turn off sharing
        $db->prepare('UPDATE baking_sessions SET is_public = 0 WHERE id = :id')
            ->execute([':id' => $id]);
        sendJson(['is_public' => false, 'share_hash' => $session['share_hash']]);
    } else {
        // Turn on sharing — generate hash if not present
        $hash = $session['share_hash'];
        if (!$hash) {
            $hash = bin2hex(random_bytes(32));
            $db->prepare('UPDATE baking_sessions SET is_public = 1, share_hash = :hash WHERE id = :id')
                ->execute([':hash' => $hash, ':id' => $id]);
        } else {
            $db->prepare('UPDATE baking_sessions SET is_public = 1 WHERE id = :id')
                ->execute([':id' => $id]);
        }
        sendJson(['is_public' => true, 'share_hash' => $hash]);
    }
}

// ─── Get shared session (public, no auth) ─────────────────
function getSharedSession(string $hash): void
{
    $db = getDb();
    $stmt = $db->prepare(
        'SELECT s.id, s.notes, s.rating, s.baked_at, s.created_at,
                s.inputs_snapshot, s.results_snapshot,
                r.name AS recipe_name, u.name AS user_name
         FROM baking_sessions s
         LEFT JOIN recipes r ON r.id = s.recipe_id
         LEFT JOIN users u ON u.id = s.user_id
         WHERE s.share_hash = :hash AND s.is_public = 1'
    );
    $stmt->execute([':hash' => $hash]);
    $session = $stmt->fetch();

    if (!$session) {
        sendJson(['error' => 'Not found'], 404);
        return;
    }

    $sessionId = (int)$session['id'];
    $session['id'] = $sessionId;
    $session['rating'] = $session['rating'] ? (int)$session['rating'] : null;
    $session['inputs_snapshot'] = json_decode($session['inputs_snapshot'], true);
    $session['results_snapshot'] = json_decode($session['results_snapshot'], true);

    // Photos
    $stmt = $db->prepare(
        'SELECT id, filename, original_name, sort_order FROM session_photos
         WHERE session_id = :sid ORDER BY sort_order'
    );
    $stmt->execute([':sid' => $sessionId]);
    $photos = $stmt->fetchAll();
    foreach ($photos as &$p) {
        $p['id'] = (int)$p['id'];
        $p['sort_order'] = (int)$p['sort_order'];
    }

    $session['photos'] = $photos;

    // Don't expose internal id to public
    unset($session['id']);

    sendJson($session);
}

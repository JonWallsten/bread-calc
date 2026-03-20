ALTER TABLE baking_sessions
    ADD COLUMN share_hash VARCHAR(64) DEFAULT NULL AFTER rating,
    ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER share_hash,
    ADD UNIQUE KEY idx_share_hash (share_hash);

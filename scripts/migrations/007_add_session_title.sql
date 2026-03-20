ALTER TABLE baking_sessions
    ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER user_id;

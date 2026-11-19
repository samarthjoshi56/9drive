CREATE TABLE `memory_indexing_settings` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `connected_account_id` CHAR(36) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `memory_indexing_settings_connected_account_id_key` (`connected_account_id`),
  INDEX `memory_indexing_settings_user_id_enabled_idx` (`user_id`, `enabled`),
  CONSTRAINT `memory_indexing_settings_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `memory_indexing_settings_connected_account_id_fkey`
    FOREIGN KEY (`connected_account_id`) REFERENCES `connected_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

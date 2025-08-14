<?php
/**
 * Database configuration for PocketBase connection
 */
return [
    'pocketbase_url' => $_ENV['POCKETBASE_URL'] ?? 'http://localhost:8090',
    'pocketbase_admin_email' => $_ENV['POCKETBASE_ADMIN_EMAIL'] ?? 'admin@lifecalendar.local',
    'pocketbase_admin_password' => $_ENV['POCKETBASE_ADMIN_PASSWORD'] ?? 'lifecalendar123',
    
    // Encryption key for sensitive data
    'encryption_key' => $_ENV['ENCRYPTION_KEY'] ?? 'your-secret-encryption-key-change-this',
    
    // Withings API configuration
    'withings' => [
        'api_url' => 'https://wbsapi.withings.net',
        'oauth_url' => 'https://account.withings.com/oauth2_user/authorize2',
        'token_url' => 'https://wbsapi.withings.net/v2/oauth2',
    ],
];
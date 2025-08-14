<?php
require_once '../src/PocketBaseClient.php';
require_once '../src/WithingsAPI.php';
require_once '../src/Encryption.php';

// Load configuration
$config = require '../config/database.php';

// Set up CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Initialize services
$pb = new PocketBaseClient($config['pocketbase_url']);
$withings = new WithingsAPI($pb, $config);
$encryption = new Encryption($config['encryption_key']);

// Authenticate with PocketBase
$pb->authenticate($config['pocketbase_admin_email'], $config['pocketbase_admin_password']);

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$pathParts = explode('/', trim($path, '/'));

// Get request body
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Response helper
function jsonResponse(array $data, int $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function errorResponse(string $message, int $status = 400) {
    jsonResponse(['error' => $message], $status);
}

try {
    // Route handling
    switch ($pathParts[0] ?? '') {
        case 'admin':
            require 'admin.php';
            break;
            
        case 'withings':
            require 'withings.php';
            break;
            
        case 'todos':
            require 'todos.php';
            break;
            
        case 'supplements':
            require 'supplements.php';
            break;
            
        default:
            errorResponse('Route not found', 404);
    }
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    errorResponse('Internal server error', 500);
}
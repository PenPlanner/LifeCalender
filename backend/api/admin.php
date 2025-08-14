<?php
/**
 * Admin API endpoints for settings and credentials management
 */

// Admin routes
switch ($pathParts[1] ?? '') {
    case 'settings':
        handleSettings();
        break;
        
    case 'withings':
        handleWithingsAdmin();
        break;
        
    default:
        errorResponse('Admin route not found', 404);
}

function handleSettings() {
    global $method, $pb, $input;
    
    switch ($method) {
        case 'GET':
            // Get current settings
            try {
                $settings = $pb->getRecords('settings', ['filter' => 'key="app_settings"']);
                if (!empty($settings['items'])) {
                    $settingsData = json_decode($settings['items'][0]['value'], true);
                    jsonResponse($settingsData);
                } else {
                    // Return default settings
                    jsonResponse([
                        'modules_enabled' => [
                            'withings' => true,
                            'todos' => true,
                            'supplements' => true,
                            'weekly_summary' => true
                        ],
                        'day_fields' => [
                            'steps' => true,
                            'cardio_minutes' => true,
                            'calories_out' => true,
                            'max_hr' => false,
                            'sleep' => false
                        ],
                        'goals' => [
                            'steps' => 10000,
                            'cardio_minutes' => 30,
                            'calories_out' => 2500
                        ],
                        'layout_order' => ['metrics', 'workouts', 'todos', 'supplements']
                    ]);
                }
            } catch (Exception $e) {
                errorResponse('Failed to get settings: ' . $e->getMessage());
            }
            break;
            
        case 'POST':
            // Update settings
            try {
                $settingsJson = json_encode($input);
                
                // Check if settings record exists
                $existing = $pb->getRecords('settings', ['filter' => 'key="app_settings"']);
                
                if (!empty($existing['items'])) {
                    // Update existing
                    $pb->updateRecord('settings', $existing['items'][0]['id'], [
                        'value' => $settingsJson
                    ]);
                } else {
                    // Create new
                    $pb->createRecord('settings', [
                        'key' => 'app_settings',
                        'value' => $settingsJson
                    ]);
                }
                
                jsonResponse(['success' => true]);
            } catch (Exception $e) {
                errorResponse('Failed to save settings: ' . $e->getMessage());
            }
            break;
            
        default:
            errorResponse('Method not allowed', 405);
    }
}

function handleWithingsAdmin() {
    global $method, $pathParts, $pb, $encryption, $input, $withings;
    
    switch ($pathParts[2] ?? '') {
        case 'credentials':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            
            try {
                // Encrypt credentials before storing
                $encryptedCredentials = $encryption->encryptArray([
                    'client_id' => $input['client_id'] ?? '',
                    'client_secret' => $input['client_secret'] ?? '',
                    'redirect_uri' => $input['redirect_uri'] ?? '',
                    'scopes' => $input['scopes'] ?? []
                ]);
                
                // Check if credentials record exists
                $existing = $pb->getRecords('settings', ['filter' => 'key="withings_credentials"']);
                
                if (!empty($existing['items'])) {
                    // Update existing
                    $pb->updateRecord('settings', $existing['items'][0]['id'], [
                        'value' => $encryptedCredentials
                    ]);
                } else {
                    // Create new
                    $pb->createRecord('settings', [
                        'key' => 'withings_credentials',
                        'value' => $encryptedCredentials
                    ]);
                }
                
                jsonResponse(['success' => true]);
            } catch (Exception $e) {
                errorResponse('Failed to save credentials: ' . $e->getMessage());
            }
            break;
            
        case 'test-oauth':
            if ($method !== 'GET') {
                errorResponse('Method not allowed', 405);
            }
            
            try {
                // Get encrypted credentials
                $credentialsRecord = $pb->getRecords('settings', ['filter' => 'key="withings_credentials"']);
                
                if (empty($credentialsRecord['items'])) {
                    errorResponse('No Withings credentials found');
                }
                
                $credentials = $encryption->decryptArray($credentialsRecord['items'][0]['value']);
                
                // Generate OAuth URL to test configuration
                $authUrl = $withings->getAuthorizationUrl(
                    $credentials['client_id'],
                    $credentials['redirect_uri'],
                    $credentials['scopes']
                );
                
                jsonResponse([
                    'success' => true,
                    'message' => 'OAuth configuration is valid',
                    'auth_url' => $authUrl
                ]);
            } catch (Exception $e) {
                errorResponse('OAuth test failed: ' . $e->getMessage());
            }
            break;
            
        default:
            errorResponse('Withings admin route not found', 404);
    }
}
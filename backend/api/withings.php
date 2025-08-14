<?php
/**
 * Withings API endpoints for data fetching and OAuth
 */

// Withings routes
switch ($pathParts[1] ?? '') {
    case 'week':
        handleWeekData();
        break;
        
    case 'oauth':
        handleOAuth();
        break;
        
    default:
        errorResponse('Withings route not found', 404);
}

function handleWeekData() {
    global $method, $pb, $encryption;
    
    if ($method !== 'GET') {
        errorResponse('Method not allowed', 405);
    }
    
    $startDate = $_GET['start'] ?? date('Y-m-d');
    $userId = $_GET['user_id'] ?? 'default_user';
    
    try {
        // Calculate week dates
        $start = new DateTime($startDate);
        $start->modify('this week');
        $end = clone $start;
        $end->modify('+6 days');
        
        $weekData = [
            'startDate' => $start->format('Y-m-d'),
            'days' => []
        ];
        
        // Generate week data for each day
        for ($date = clone $start; $date <= $end; $date->modify('+1 day')) {
            $dateStr = $date->format('Y-m-d');
            
            // Get cached metrics for this date
            $metricsRecord = $pb->getRecords('metrics_cache', [
                'filter' => 'user_id="' . $userId . '" && date="' . $dateStr . '"'
            ]);
            
            $dayData = [
                'date' => $dateStr,
                'metrics' => null,
                'workouts' => [],
                'todos' => [],
                'supplements' => []
            ];
            
            if (!empty($metricsRecord['items'])) {
                $record = $metricsRecord['items'][0];
                $dayData['metrics'] = [
                    'steps' => (int)($record['steps'] ?? 0),
                    'cardio_minutes' => (int)($record['cardio_minutes'] ?? 0),
                    'calories_out' => (int)($record['calories_out'] ?? 0),
                    'max_hr' => $record['max_hr'] ? (int)$record['max_hr'] : null,
                    'sleep_hours' => $record['sleep_hours'] ? (float)$record['sleep_hours'] : null
                ];
                
                // Parse workouts JSON
                if ($record['workouts']) {
                    $dayData['workouts'] = json_decode($record['workouts'], true) ?? [];
                }
            }
            
            $weekData['days'][] = $dayData;
        }
        
        jsonResponse($weekData);
    } catch (Exception $e) {
        errorResponse('Failed to get week data: ' . $e->getMessage());
    }
}

function handleOAuth() {
    global $method, $pathParts, $pb, $encryption, $withings, $input;
    
    switch ($pathParts[2] ?? '') {
        case 'initiate':
            if ($method !== 'GET') {
                errorResponse('Method not allowed', 405);
            }
            
            try {
                // Get credentials
                $credentialsRecord = $pb->getRecords('settings', ['filter' => 'key="withings_credentials"']);
                
                if (empty($credentialsRecord['items'])) {
                    errorResponse('No Withings credentials configured');
                }
                
                $credentials = $encryption->decryptArray($credentialsRecord['items'][0]['value']);
                
                $authUrl = $withings->getAuthorizationUrl(
                    $credentials['client_id'],
                    $credentials['redirect_uri'],
                    $credentials['scopes']
                );
                
                jsonResponse(['authUrl' => $authUrl]);
            } catch (Exception $e) {
                errorResponse('Failed to initiate OAuth: ' . $e->getMessage());
            }
            break;
            
        case 'callback':
            if ($method !== 'POST') {
                errorResponse('Method not allowed', 405);
            }
            
            try {
                $code = $input['code'] ?? '';
                $userId = $input['user_id'] ?? 'default_user';
                
                if (!$code) {
                    errorResponse('Authorization code required');
                }
                
                // Get credentials
                $credentialsRecord = $pb->getRecords('settings', ['filter' => 'key="withings_credentials"']);
                
                if (empty($credentialsRecord['items'])) {
                    errorResponse('No Withings credentials configured');
                }
                
                $credentials = $encryption->decryptArray($credentialsRecord['items'][0]['value']);
                
                // Exchange code for tokens
                $tokens = $withings->exchangeCodeForTokens(
                    $code,
                    $credentials['client_id'],
                    $credentials['client_secret'],
                    $credentials['redirect_uri']
                );
                
                if (!$tokens) {
                    errorResponse('Failed to exchange authorization code for tokens');
                }
                
                // Store tokens in PocketBase
                $expiresAt = date('Y-m-d H:i:s', time() + $tokens['expires_in']);
                
                $tokenData = [
                    'user_id' => $userId,
                    'access_token' => $encryption->encrypt($tokens['access_token']),
                    'refresh_token' => $encryption->encrypt($tokens['refresh_token']),
                    'expires_at' => $expiresAt
                ];
                
                // Check if token record exists for this user
                $existingTokens = $pb->getRecords('withings_tokens', [
                    'filter' => 'user_id="' . $userId . '"'
                ]);
                
                if (!empty($existingTokens['items'])) {
                    $pb->updateRecord('withings_tokens', $existingTokens['items'][0]['id'], $tokenData);
                } else {
                    $pb->createRecord('withings_tokens', $tokenData);
                }
                
                jsonResponse(['success' => true, 'message' => 'Withings account connected successfully']);
            } catch (Exception $e) {
                errorResponse('OAuth callback failed: ' . $e->getMessage());
            }
            break;
            
        default:
            errorResponse('OAuth route not found', 404);
    }
}
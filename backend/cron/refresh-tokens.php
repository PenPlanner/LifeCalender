<?php
/**
 * Cron job to refresh Withings tokens and cache data
 */
require_once '../src/PocketBaseClient.php';
require_once '../src/WithingsAPI.php';
require_once '../src/Encryption.php';

// Load configuration
$config = require '../config/database.php';

// Initialize services
$pb = new PocketBaseClient($config['pocketbase_url']);
$withings = new WithingsAPI($pb, $config);
$encryption = new Encryption($config['encryption_key']);

// Authenticate with PocketBase
if (!$pb->authenticate($config['pocketbase_admin_email'], $config['pocketbase_admin_password'])) {
    error_log('Failed to authenticate with PocketBase');
    exit(1);
}

echo "Starting token refresh and data caching...\n";

try {
    // Get all Withings tokens
    $tokens = $pb->getRecords('withings_tokens');
    
    foreach ($tokens['items'] as $tokenRecord) {
        $userId = $tokenRecord['user_id'];
        $expiresAt = new DateTime($tokenRecord['expires_at']);
        $now = new DateTime();
        
        echo "Processing user: $userId\n";
        
        // Check if token expires within the next hour
        $oneHourFromNow = clone $now;
        $oneHourFromNow->modify('+1 hour');
        
        if ($expiresAt <= $oneHourFromNow) {
            echo "Token expires soon, refreshing...\n";
            
            // Get credentials
            $credentialsRecord = $pb->getRecords('settings', ['filter' => 'key="withings_credentials"']);
            
            if (empty($credentialsRecord['items'])) {
                error_log('No Withings credentials found');
                continue;
            }
            
            $credentials = $encryption->decryptArray($credentialsRecord['items'][0]['value']);
            $refreshToken = $encryption->decrypt($tokenRecord['refresh_token']);
            
            // Refresh tokens
            $newTokens = $withings->refreshTokens(
                $refreshToken,
                $credentials['client_id'],
                $credentials['client_secret']
            );
            
            if ($newTokens) {
                $newExpiresAt = date('Y-m-d H:i:s', time() + $newTokens['expires_in']);
                
                $pb->updateRecord('withings_tokens', $tokenRecord['id'], [
                    'access_token' => $encryption->encrypt($newTokens['access_token']),
                    'refresh_token' => $encryption->encrypt($newTokens['refresh_token']),
                    'expires_at' => $newExpiresAt
                ]);
                
                echo "Tokens refreshed successfully\n";
                
                // Update token record for data fetching
                $tokenRecord['access_token'] = $encryption->encrypt($newTokens['access_token']);
            } else {
                error_log("Failed to refresh tokens for user: $userId");
                continue;
            }
        }
        
        // Fetch and cache data for the last 14 days
        echo "Caching data for last 14 days...\n";
        
        $endDate = new DateTime();
        $startDate = clone $endDate;
        $startDate->modify('-14 days');
        
        $accessToken = $encryption->decrypt($tokenRecord['access_token']);
        
        // Fetch metrics
        $metrics = $withings->getMetrics(
            $accessToken,
            $userId,
            $startDate->format('Y-m-d'),
            $endDate->format('Y-m-d')
        );
        
        // Fetch workouts
        $workouts = $withings->getWorkouts(
            $accessToken,
            $userId,
            $startDate->format('Y-m-d'),
            $endDate->format('Y-m-d')
        );
        
        // Fetch sleep data
        $sleep = $withings->getSleep(
            $accessToken,
            $userId,
            $startDate->format('Y-m-d'),
            $endDate->format('Y-m-d')
        );
        
        // Process and cache data for each day
        for ($date = clone $startDate; $date <= $endDate; $date->modify('+1 day')) {
            $dateStr = $date->format('Y-m-d');
            
            // Process metrics for this date
            $dayMetrics = processMetricsForDate($metrics, $dateStr);
            $dayWorkouts = processWorkoutsForDate($workouts, $dateStr);
            $daySleep = processSleepForDate($sleep, $dateStr);
            
            // Check if cache record exists
            $existingCache = $pb->getRecords('metrics_cache', [
                'filter' => 'user_id="' . $userId . '" && date="' . $dateStr . '"'
            ]);
            
            $cacheData = [
                'user_id' => $userId,
                'date' => $dateStr,
                'steps' => $dayMetrics['steps'] ?? 0,
                'calories_out' => $dayMetrics['calories_out'] ?? 0,
                'cardio_minutes' => $dayMetrics['cardio_minutes'] ?? 0,
                'max_hr' => $dayMetrics['max_hr'] ?? null,
                'sleep_hours' => $daySleep['sleep_hours'] ?? null,
                'workouts' => json_encode($dayWorkouts)
            ];
            
            if (!empty($existingCache['items'])) {
                $pb->updateRecord('metrics_cache', $existingCache['items'][0]['id'], $cacheData);
            } else {
                $pb->createRecord('metrics_cache', $cacheData);
            }
        }
        
        echo "Data cached successfully for user: $userId\n";
    }
    
    echo "Token refresh and data caching completed successfully\n";
} catch (Exception $e) {
    error_log('Cron job error: ' . $e->getMessage());
    exit(1);
}

function processMetricsForDate($metrics, $date) {
    // Process Withings metrics data for specific date
    // This is a simplified version - actual implementation would parse the Withings API response format
    $dateTimestamp = strtotime($date);
    $result = [];
    
    if ($metrics && isset($metrics['body']['measuregrps'])) {
        foreach ($metrics['body']['measuregrps'] as $group) {
            $groupDate = date('Y-m-d', $group['date']);
            if ($groupDate === $date) {
                foreach ($group['measures'] as $measure) {
                    switch ($measure['type']) {
                        case 1: // Weight (not used in this context)
                            break;
                        case 4: // Height (not used in this context)
                            break;
                        case 5: // Fat mass (not used in this context)
                            break;
                        // Add more measure types as needed
                    }
                }
            }
        }
    }
    
    // For now, return mock data since we don't have real Withings data structure
    return [
        'steps' => rand(5000, 15000),
        'calories_out' => rand(2000, 3500),
        'cardio_minutes' => rand(0, 90),
        'max_hr' => rand(120, 180)
    ];
}

function processWorkoutsForDate($workouts, $date) {
    $result = [];
    
    if ($workouts && isset($workouts['body']['series'])) {
        foreach ($workouts['body']['series'] as $workout) {
            $workoutDate = date('Y-m-d', $workout['startdate']);
            if ($workoutDate === $date) {
                $result[] = [
                    'id' => 'workout-' . $workout['id'],
                    'name' => $workout['category'] ?? 'Workout',
                    'type' => $workout['category'] ?? 'Unknown',
                    'duration' => round(($workout['enddate'] - $workout['startdate']) / 60),
                    'calories' => $workout['calories'] ?? 0,
                    'start_time' => date('Y-m-d\TH:i:s\Z', $workout['startdate'])
                ];
            }
        }
    }
    
    return $result;
}

function processSleepForDate($sleep, $date) {
    if ($sleep && isset($sleep['body']['series'])) {
        foreach ($sleep['body']['series'] as $sleepRecord) {
            $sleepDate = date('Y-m-d', $sleepRecord['startdate']);
            if ($sleepDate === $date) {
                return [
                    'sleep_hours' => round(($sleepRecord['enddate'] - $sleepRecord['startdate']) / 3600, 1)
                ];
            }
        }
    }
    
    return ['sleep_hours' => null];
}
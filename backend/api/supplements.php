<?php
/**
 * Supplements API endpoints
 */

switch ($pathParts[1] ?? '') {
    case 'toggle':
        handleToggleSupplement();
        break;
        
    case '':
        if ($method === 'GET') {
            handleGetSupplements();
        } else {
            errorResponse('Method not allowed', 405);
        }
        break;
        
    default:
        errorResponse('Supplements route not found', 404);
}

function handleGetSupplements() {
    global $pb;
    
    $userId = $_GET['user_id'] ?? 'default_user';
    $startDate = $_GET['start'] ?? '';
    $endDate = $_GET['end'] ?? '';
    
    $filter = 'user_id="' . $userId . '"';
    
    if ($startDate && $endDate) {
        $filter .= ' && date>="' . $startDate . '" && date<="' . $endDate . '"';
    }
    
    try {
        $supplements = $pb->getRecords('supplements', [
            'filter' => $filter,
            'sort' => 'date,key'
        ]);
        
        $formattedSupplements = array_map(function($supplement) {
            return [
                'id' => $supplement['id'],
                'user_id' => $supplement['user_id'],
                'date' => $supplement['date'],
                'key' => $supplement['key'],
                'taken' => (bool)$supplement['taken']
            ];
        }, $supplements['items'] ?? []);
        
        jsonResponse($formattedSupplements);
    } catch (Exception $e) {
        errorResponse('Failed to get supplements: ' . $e->getMessage());
    }
}

function handleToggleSupplement() {
    global $method, $pb, $input;
    
    if ($method !== 'POST') {
        errorResponse('Method not allowed', 405);
    }
    
    $requiredFields = ['user_id', 'date', 'key'];
    
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            errorResponse("Field '$field' is required");
        }
    }
    
    $userId = $input['user_id'];
    $date = $input['date'];
    $key = $input['key'];
    
    // Validate supplement key
    $validKeys = ['vitamin_d', 'omega_3', 'creatine', 'magnesium'];
    if (!in_array($key, $validKeys)) {
        errorResponse('Invalid supplement key. Must be one of: ' . implode(', ', $validKeys));
    }
    
    try {
        // Check if supplement record exists
        $existing = $pb->getRecords('supplements', [
            'filter' => 'user_id="' . $userId . '" && date="' . $date . '" && key="' . $key . '"'
        ]);
        
        if (!empty($existing['items'])) {
            // Toggle existing record
            $supplement = $existing['items'][0];
            $newTakenStatus = !$supplement['taken'];
            
            $updatedSupplement = $pb->updateRecord('supplements', $supplement['id'], [
                'taken' => $newTakenStatus
            ]);
            
            $result = [
                'id' => $updatedSupplement['id'],
                'user_id' => $updatedSupplement['user_id'],
                'date' => $updatedSupplement['date'],
                'key' => $updatedSupplement['key'],
                'taken' => (bool)$updatedSupplement['taken']
            ];
        } else {
            // Create new record (default to taken = true)
            $supplementData = [
                'user_id' => $userId,
                'date' => $date,
                'key' => $key,
                'taken' => true
            ];
            
            $newSupplement = $pb->createRecord('supplements', $supplementData);
            
            $result = [
                'id' => $newSupplement['id'],
                'user_id' => $newSupplement['user_id'],
                'date' => $newSupplement['date'],
                'key' => $newSupplement['key'],
                'taken' => (bool)$newSupplement['taken']
            ];
        }
        
        jsonResponse($result);
    } catch (Exception $e) {
        errorResponse('Failed to toggle supplement: ' . $e->getMessage());
    }
}
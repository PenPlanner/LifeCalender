<?php
/**
 * Todos API endpoints
 */

$todoId = $pathParts[1] ?? null;

switch ($method) {
    case 'GET':
        handleGetTodos();
        break;
        
    case 'POST':
        if ($todoId) {
            errorResponse('Cannot POST to specific todo ID', 400);
        }
        handleCreateTodo();
        break;
        
    case 'PATCH':
        if (!$todoId) {
            errorResponse('Todo ID required for PATCH', 400);
        }
        handleUpdateTodo($todoId);
        break;
        
    case 'DELETE':
        if (!$todoId) {
            errorResponse('Todo ID required for DELETE', 400);
        }
        handleDeleteTodo($todoId);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function handleGetTodos() {
    global $pb;
    
    $userId = $_GET['user_id'] ?? 'default_user';
    $startDate = $_GET['start'] ?? '';
    $endDate = $_GET['end'] ?? '';
    
    $filter = 'user_id="' . $userId . '"';
    
    if ($startDate && $endDate) {
        $filter .= ' && date>="' . $startDate . '" && date<="' . $endDate . '"';
    }
    
    try {
        $todos = $pb->getRecords('todos', [
            'filter' => $filter,
            'sort' => '-created'
        ]);
        
        $formattedTodos = array_map(function($todo) {
            return [
                'id' => $todo['id'],
                'user_id' => $todo['user_id'],
                'date' => $todo['date'],
                'text' => $todo['text'],
                'done' => (bool)$todo['done'],
                'created_at' => $todo['created']
            ];
        }, $todos['items'] ?? []);
        
        jsonResponse($formattedTodos);
    } catch (Exception $e) {
        errorResponse('Failed to get todos: ' . $e->getMessage());
    }
}

function handleCreateTodo() {
    global $pb, $input;
    
    $requiredFields = ['user_id', 'date', 'text'];
    
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            errorResponse("Field '$field' is required");
        }
    }
    
    try {
        $todoData = [
            'user_id' => $input['user_id'],
            'date' => $input['date'],
            'text' => $input['text'],
            'done' => false
        ];
        
        $todo = $pb->createRecord('todos', $todoData);
        
        $formattedTodo = [
            'id' => $todo['id'],
            'user_id' => $todo['user_id'],
            'date' => $todo['date'],
            'text' => $todo['text'],
            'done' => (bool)$todo['done'],
            'created_at' => $todo['created']
        ];
        
        jsonResponse($formattedTodo, 201);
    } catch (Exception $e) {
        errorResponse('Failed to create todo: ' . $e->getMessage());
    }
}

function handleUpdateTodo($todoId) {
    global $pb, $input;
    
    try {
        // Get existing todo
        $existingTodo = $pb->getRecord('todos', $todoId);
        
        if (!$existingTodo) {
            errorResponse('Todo not found', 404);
        }
        
        $updateData = [];
        
        if (isset($input['text'])) {
            $updateData['text'] = $input['text'];
        }
        
        if (isset($input['done'])) {
            $updateData['done'] = (bool)$input['done'];
        }
        
        if (isset($input['date'])) {
            $updateData['date'] = $input['date'];
        }
        
        if (empty($updateData)) {
            errorResponse('No valid fields to update');
        }
        
        $updatedTodo = $pb->updateRecord('todos', $todoId, $updateData);
        
        $formattedTodo = [
            'id' => $updatedTodo['id'],
            'user_id' => $updatedTodo['user_id'],
            'date' => $updatedTodo['date'],
            'text' => $updatedTodo['text'],
            'done' => (bool)$updatedTodo['done'],
            'created_at' => $updatedTodo['created']
        ];
        
        jsonResponse($formattedTodo);
    } catch (Exception $e) {
        errorResponse('Failed to update todo: ' . $e->getMessage());
    }
}

function handleDeleteTodo($todoId) {
    global $pb;
    
    try {
        $success = $pb->deleteRecord('todos', $todoId);
        
        if (!$success) {
            errorResponse('Todo not found', 404);
        }
        
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        errorResponse('Failed to delete todo: ' . $e->getMessage());
    }
}
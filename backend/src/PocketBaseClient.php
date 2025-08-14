<?php
/**
 * PocketBase client for PHP API
 */
class PocketBaseClient {
    private string $baseUrl;
    private string $authToken = '';
    
    public function __construct(string $baseUrl) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    
    public function authenticate(string $email, string $password): bool {
        $response = $this->request('POST', '/api/admins/auth-with-password', [
            'identity' => $email,
            'password' => $password
        ]);
        
        if (isset($response['token'])) {
            $this->authToken = $response['token'];
            return true;
        }
        
        return false;
    }
    
    public function getRecords(string $collection, array $params = []): array {
        $queryString = !empty($params) ? '?' . http_build_query($params) : '';
        return $this->request('GET', "/api/collections/{$collection}/records{$queryString}");
    }
    
    public function getRecord(string $collection, string $id): array {
        return $this->request('GET', "/api/collections/{$collection}/records/{$id}");
    }
    
    public function createRecord(string $collection, array $data): array {
        return $this->request('POST', "/api/collections/{$collection}/records", $data);
    }
    
    public function updateRecord(string $collection, string $id, array $data): array {
        return $this->request('PATCH', "/api/collections/{$collection}/records/{$id}", $data);
    }
    
    public function deleteRecord(string $collection, string $id): bool {
        $response = $this->request('DELETE', "/api/collections/{$collection}/records/{$id}");
        return $response !== false;
    }
    
    private function request(string $method, string $endpoint, array $data = []): mixed {
        $url = $this->baseUrl . $endpoint;
        $headers = ['Content-Type: application/json'];
        
        if ($this->authToken) {
            $headers[] = 'Authorization: Bearer ' . $this->authToken;
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        if (!empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false) {
            return false;
        }
        
        $decodedResponse = json_decode($response, true);
        
        if ($httpCode >= 400) {
            error_log("PocketBase API error: HTTP {$httpCode} - " . $response);
            return false;
        }
        
        return $decodedResponse;
    }
}
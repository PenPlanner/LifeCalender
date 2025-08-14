<?php
/**
 * Withings API client for OAuth and data fetching
 */
class WithingsAPI {
    private PocketBaseClient $pb;
    private array $config;
    
    public function __construct(PocketBaseClient $pb, array $config) {
        $this->pb = $pb;
        $this->config = $config;
    }
    
    public function getAuthorizationUrl(string $clientId, string $redirectUri, array $scopes): string {
        $params = [
            'response_type' => 'code',
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'scope' => implode(',', $scopes),
            'state' => bin2hex(random_bytes(16))
        ];
        
        return $this->config['withings']['oauth_url'] . '?' . http_build_query($params);
    }
    
    public function exchangeCodeForTokens(string $code, string $clientId, string $clientSecret, string $redirectUri): array|false {
        $data = [
            'grant_type' => 'authorization_code',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $code,
            'redirect_uri' => $redirectUri
        ];
        
        return $this->makeTokenRequest($data);
    }
    
    public function refreshTokens(string $refreshToken, string $clientId, string $clientSecret): array|false {
        $data = [
            'grant_type' => 'refresh_token',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $refreshToken
        ];
        
        return $this->makeTokenRequest($data);
    }
    
    private function makeTokenRequest(array $data): array|false {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->config['withings']['token_url'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false || $httpCode >= 400) {
            return false;
        }
        
        return json_decode($response, true);
    }
    
    public function getMetrics(string $accessToken, string $userId, string $startDate, string $endDate): array|false {
        $params = [
            'action' => 'getmeas',
            'userid' => $userId,
            'meastype' => '1,4,5,6,8,9,10,11', // Steps, weight, height, etc.
            'category' => '1',
            'startdate' => strtotime($startDate),
            'enddate' => strtotime($endDate),
        ];
        
        return $this->makeApiRequest('measure', $params, $accessToken);
    }
    
    public function getWorkouts(string $accessToken, string $userId, string $startDate, string $endDate): array|false {
        $params = [
            'action' => 'get',
            'userid' => $userId,
            'startdateymd' => $startDate,
            'enddateymd' => $endDate,
        ];
        
        return $this->makeApiRequest('v2/workout', $params, $accessToken);
    }
    
    public function getSleep(string $accessToken, string $userId, string $startDate, string $endDate): array|false {
        $params = [
            'action' => 'get',
            'userid' => $userId,
            'startdate' => strtotime($startDate),
            'enddate' => strtotime($endDate),
        ];
        
        return $this->makeApiRequest('v2/sleep', $params, $accessToken);
    }
    
    private function makeApiRequest(string $endpoint, array $params, string $accessToken): array|false {
        $url = $this->config['withings']['api_url'] . '/' . $endpoint;
        $params['access_token'] = $accessToken;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url . '?' . http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false || $httpCode >= 400) {
            return false;
        }
        
        return json_decode($response, true);
    }
}
<?php
/**
 * Encryption utility for sensitive data
 */
class Encryption {
    private string $key;
    private string $cipher = 'AES-256-GCM';
    
    public function __construct(string $key) {
        $this->key = hash('sha256', $key, true);
    }
    
    public function encrypt(string $data): string {
        $iv = random_bytes(16);
        $tag = '';
        
        $encrypted = openssl_encrypt($data, $this->cipher, $this->key, OPENSSL_RAW_DATA, $iv, $tag);
        
        if ($encrypted === false) {
            throw new Exception('Encryption failed');
        }
        
        return base64_encode($iv . $tag . $encrypted);
    }
    
    public function decrypt(string $encryptedData): string {
        $data = base64_decode($encryptedData);
        
        if ($data === false || strlen($data) < 32) {
            throw new Exception('Invalid encrypted data');
        }
        
        $iv = substr($data, 0, 16);
        $tag = substr($data, 16, 16);
        $encrypted = substr($data, 32);
        
        $decrypted = openssl_decrypt($encrypted, $this->cipher, $this->key, OPENSSL_RAW_DATA, $iv, $tag);
        
        if ($decrypted === false) {
            throw new Exception('Decryption failed');
        }
        
        return $decrypted;
    }
    
    public function encryptArray(array $data): string {
        return $this->encrypt(json_encode($data));
    }
    
    public function decryptArray(string $encryptedData): array {
        $json = $this->decrypt($encryptedData);
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception('Failed to decode decrypted JSON');
        }
        
        return $data;
    }
}
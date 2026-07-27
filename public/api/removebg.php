<?php
/**
 * UtiloBox — Background Remover PHP Proxy
 * 
 * Forwards image to Hugging Face Inference API (briaai/RMBG-1.4)
 * The HF token is stored securely here on the server — users do NOT need their own token.
 *
 * Deploy this file to: public_html/api/removebg.php
 *
 * SETUP: Replace the value of HF_TOKEN below with your Hugging Face token.
 * Get a free token at: https://huggingface.co/settings/tokens (type: Read / Inference)
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
define('HF_TOKEN', 'hf_REPLACE_WITH_YOUR_TOKEN_HERE');
define('HF_API_URL', 'https://api-inference.huggingface.co/models/briaai/RMBG-1.4');
define('MAX_FILE_SIZE_MB', 10);
define('ALLOWED_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// ── CORS Headers ──────────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Method Check ──────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

// ── Token Check ───────────────────────────────────────────────────────────────
if (HF_TOKEN === 'hf_REPLACE_WITH_YOUR_TOKEN_HERE' || empty(HF_TOKEN)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Server belum dikonfigurasi. Hubungi admin.']);
    exit;
}

// ── File Validation ───────────────────────────────────────────────────────────
if (empty($_FILES['image'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Tidak ada file gambar yang diterima.']);
    exit;
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Upload error: ' . $file['error']]);
    exit;
}

// Size check
$maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
if ($file['size'] > $maxBytes) {
    http_response_code(413);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'File terlalu besar. Maksimal ' . MAX_FILE_SIZE_MB . 'MB.']);
    exit;
}

// MIME type check using finfo
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, ALLOWED_TYPES)) {
    http_response_code(415);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.']);
    exit;
}

// ── Read Image Data ───────────────────────────────────────────────────────────
$imageData = file_get_contents($file['tmp_name']);
if ($imageData === false) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Gagal membaca file gambar.']);
    exit;
}

// ── Forward to Hugging Face API ───────────────────────────────────────────────
$ch = curl_init(HF_API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $imageData,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . HF_TOKEN,
        'Content-Type: ' . $mimeType,
        'Content-Length: ' . strlen($imageData),
    ],
]);

$response     = curl_exec($ch);
$httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType  = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError    = curl_error($ch);
curl_close($ch);

// ── Handle cURL Error ─────────────────────────────────────────────────────────
if ($curlError) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Koneksi ke server AI gagal: ' . $curlError]);
    exit;
}

// ── Handle HF API Non-200 ─────────────────────────────────────────────────────
if ($httpCode !== 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');

    if ($httpCode === 503) {
        echo json_encode(['error' => 'Model AI sedang loading. Tunggu ~20 detik lalu coba lagi.']);
    } elseif ($httpCode === 401) {
        echo json_encode(['error' => 'Token server tidak valid. Hubungi admin.']);
    } elseif ($httpCode === 429) {
        echo json_encode(['error' => 'Server AI terlalu sibuk. Coba beberapa menit lagi.']);
    } else {
        // Try to forward HF error message
        $decoded = @json_decode($response, true);
        $msg = $decoded['error'] ?? 'Server AI mengembalikan error ' . $httpCode;
        echo json_encode(['error' => $msg]);
    }
    exit;
}

// ── Return PNG Result to Browser ──────────────────────────────────────────────
header('Content-Type: image/png');
header('Content-Length: ' . strlen($response));
header('Cache-Control: no-store');
echo $response;

<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'rsvp.json';

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!is_dir($dataDir) && !mkdir($dataDir, 0750, true) && !is_dir($dataDir)) {
    respond(500, ['error' => 'Penyimpanan belum dapat dibuat.']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $items = is_file($dataFile) ? json_decode((string) file_get_contents($dataFile), true) : [];
    respond(200, is_array($items) ? $items : []);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Metode tidak didukung.']);
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) respond(400, ['error' => 'Data RSVP tidak valid.']);

$name = trim(strip_tags((string) ($input['name'] ?? '')));
$status = (string) ($input['status'] ?? '');
$count = filter_var($input['count'] ?? 0, FILTER_VALIDATE_INT);
$message = trim(strip_tags((string) ($input['msg'] ?? '')));
if ($name === '' || mb_strlen($name) > 100 || !in_array($status, ['Hadir', 'Tidak'], true) || $count === false || $count < 0 || $count > 20 || $message === '' || mb_strlen($message) > 1000) {
    respond(422, ['error' => 'Mohon periksa nama, kehadiran, jumlah tamu, dan ucapan.']);
}

$handle = fopen($dataFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) respond(500, ['error' => 'Gagal membuka penyimpanan RSVP.']);
$contents = stream_get_contents($handle);
$items = $contents ? json_decode($contents, true) : [];
if (!is_array($items)) $items = [];
$items[] = ['name' => $name, 'status' => $status, 'count' => $count, 'msg' => $message, 'ts' => time() * 1000];
rewind($handle);
ftruncate($handle, 0);
$written = fwrite($handle, json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);
if ($written === false) respond(500, ['error' => 'Gagal menyimpan RSVP.']);
respond(201, ['ok' => true]);

<?php
// backend/utils.php

function readJson($filename) {
    if (!file_exists($filename)) return [];
    $content = file_get_contents($filename);
    return json_decode($content, true) ?? [];
}

function writeJson($filename, $data) {
    // Safe write with file locking
    $fp = fopen($filename, 'c+');
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

function jsonResponse($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
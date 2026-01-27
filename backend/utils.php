<?php
// backend/utils.php

function getPath($filename) {
    // This ensures we look relative to THIS file (utils.php), 
    // solving directory issues on Vercel.
    return __DIR__ . '/' . $filename;
}

function readJson($filename) {
    $path = getPath($filename); // Use absolute path
    if (!file_exists($path)) return [];
    $content = file_get_contents($path);
    return json_decode($content, true) ?? [];
}

function writeJson($filename, $data) {
    $path = getPath($filename); // Use absolute path
    
    // NOTE: On Vercel, this might fail or not persist.
    // We suppress errors with @ for the demo.
    $fp = @fopen($path, 'c+');
    if ($fp) {
        if (flock($fp, LOCK_EX)) {
            ftruncate($fp, 0);
            fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
            fflush($fp);
            flock($fp, LOCK_UN);
        }
        fclose($fp);
    }
}

function jsonResponse($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
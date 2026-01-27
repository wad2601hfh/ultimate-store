<?php
require_once '../utils.php';
$input = json_decode(file_get_contents('php://input'), true);

$order = [
    'id' => uniqid('ord_'),
    'foodId' => $input['foodId'],
    'foodName' => $input['foodName'],
    'price' => $input['price'],
    'date' => date('Y-m-d H:i:s')
];

$orders = readJson('../data/orders.json');
$orders[] = $order;
writeJson('../data/orders.json', $orders);

jsonResponse(['success' => true]);
?>
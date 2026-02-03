<?php
require_once '../utils.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$chatFile = '../data/chat.json';
$foodFile = '../data/foods.json';
$orderFile = '../data/orders.json';

// POLL
if ($action === 'poll') {
    $chats = readJson($chatFile);
    jsonResponse(['messages' => $chats]);
}

// SEND TEXT + GHOST AI
if ($action === 'send_text') {
    $chats = readJson($chatFile);
    $chats[] = [
        'type' => 'text',
        'sender' => $input['sender'],
        'text' => $input['text'],
        'time' => date('H:i')
    ];

    if ($input['sender'] === 'buyer') {
        $foods = readJson($foodFile);
        $query = strtolower($input['text']);
        $matches = [];

        foreach ($foods as $food) {
            $tags = strtolower($food['tags'] . ' ' . $food['category'] . ' ' . $food['name']);
            if (strpos($tags, $query) !== false) $matches[] = $food;
        }

        if (count($matches) > 0) {
            shuffle($matches);
            $top = array_slice($matches, 0, 3);
            
            // AI_HINT: Hidden from buyer, visible to seller
            $chats[] = [
                'type' => 'ai_hint', 
                'sender' => 'system',
                'matches' => $top,
                'trigger' => $input['text'],
                'time' => date('H:i')
            ];
        }
    }
    writeJson($chatFile, $chats);
    jsonResponse(['success' => true]);
}

// SELLER PUSH CARD
if ($action === 'send_card') {
    $chats = readJson($chatFile);
    $chats[] = [
        'type' => 'card', 
        'sender' => 'seller',
        'foodName' => $input['foodName'], 
        'price' => $input['price'],
        'desc' => $input['desc'], 
        'store' => 'Concierge Pick',
        'time' => date('H:i')
    ];
    writeJson($chatFile, $chats);
    jsonResponse(['success' => true]);
}

// GET MENU
if ($action === 'get_menu') {
    jsonResponse(['menu' => readJson($foodFile)]);
}

// ORDER
if ($action === 'place_order') {
    $orders = readJson($orderFile);
    $id = 'ORD-' . strtoupper(substr(uniqid(), -5));
    $orders[] = ['id'=>$id, 'items'=>$input['items'], 'total'=>$input['total'], 'time'=>date('Y-m-d H:i')];
    writeJson($orderFile, $orders);

    $chats = readJson($chatFile);
    $chats[] = ['type'=>'system', 'sender'=>'system', 'text'=>"🚀 ORDER PAID ($id) - Rp " . number_format($input['total']), 'time'=>date('H:i')];
    writeJson($chatFile, $chats);
    jsonResponse(['success'=>true]);
}
?>
<?php
require_once '../utils.php';

// Load Input & Files
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$chatFile = '../data/chat.json';
$foodFile = '../data/foods.json';
$orderFile = '../data/orders.json';

// 1. POLL MESSAGES
if ($action === 'poll') {
    $chats = readJson($chatFile);
    jsonResponse(['messages' => $chats]);
}

// 2. SEND TEXT (WITH GHOST AI LOGIC)
if ($action === 'send_text') {
    $chats = readJson($chatFile);
    
    // A. Save the Actual Message
    $chats[] = [
        'type' => 'text',
        'sender' => $input['sender'],
        'text' => $input['text'],
        'time' => date('H:i')
    ];

    // B. AI ANALYSIS (Only runs if Buyer sends message)
    if ($input['sender'] === 'buyer') {
        $foods = readJson($foodFile);
        $query = strtolower($input['text']);
        $matches = [];

        // Scan database for keywords
        foreach ($foods as $food) {
            $tags = strtolower($food['tags'] . ' ' . $food['category'] . ' ' . $food['name']);
            if (strpos($tags, $query) !== false) {
                $matches[] = $food;
            }
        }

        // If matches found, save a "Ghost Hint" (Type: ai_hint)
        if (count($matches) > 0) {
            shuffle($matches);
            $top = array_slice($matches, 0, 3);
            
            $chats[] = [
                'type' => 'ai_hint',    // Special type
                'sender' => 'system',
                'matches' => $top,      // Contains raw data for Seller buttons
                'trigger' => $input['text'],
                'time' => date('H:i')
            ];
        }
    }

    writeJson($chatFile, $chats);
    jsonResponse(['success' => true]);
}

// 3. SELLER MANUALLY PUSHES CARD
// (This is triggered when Seller clicks a Ghost Hint button)
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

// 4. GET MENU
if ($action === 'get_menu') {
    $foods = readJson($foodFile);
    jsonResponse(['menu' => $foods]);
}

// 5. PLACE ORDER
if ($action === 'place_order') {
    $orders = readJson($orderFile);
    $id = 'ORD-' . strtoupper(substr(uniqid(), -5));
    
    $orders[] = [
        'id' => $id, 
        'items' => $input['items'], 
        'total' => $input['total'], 
        'time' => date('Y-m-d H:i')
    ];
    writeJson($orderFile, $orders);

    // Notify Chat
    $chats = readJson($chatFile);
    $chats[] = [
        'type' => 'system', 
        'sender' => 'system', 
        'text' => "🚀 ORDER PAID ($id) - Rp " . number_format($input['total']), 
        'time' => date('H:i')
    ];
    writeJson($chatFile, $chats);

    jsonResponse(['success' => true]);
}
?>
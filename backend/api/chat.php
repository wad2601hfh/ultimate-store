<?php
require_once '../utils.php';

$input = json_decode(file_get_contents('php://input'), true);
$message = strtolower($input['message'] ?? '');

$response = [
    'text' => '',
    'action' => 'recommend', 
    'query' => ''
];

// --- INTENT RECOGNITION ---

if (strpos($message, 'sweet') !== false || strpos($message, 'dessert') !== false || strpos($message, 'martabak') !== false) {
    $response['text'] = "I've curated the top 3 Desserts & Sweets for you.";
    $response['query'] = 'sweet dessert martabak pisang';
} 
elseif (strpos($message, 'padang') !== false || strpos($message, 'rendang') !== false) {
    $response['text'] = "Showing the best Padang & Beef options.";
    $response['query'] = 'rendang padang dendeng';
} 
elseif (strpos($message, 'duck') !== false || strpos($message, 'bebek') !== false) {
    $response['text'] = "Here are the top Duck (Bebek) dishes, ranked by rating.";
    $response['query'] = 'bebek duck';
} 
elseif (strpos($message, 'chicken') !== false || strpos($message, 'ayam') !== false) {
    $response['text'] = "Comparing ratings for Chicken dishes...";
    $response['query'] = 'ayam chicken';
} 
elseif (strpos($message, 'soup') !== false || strpos($message, 'soto') !== false || strpos($message, 'kuah') !== false || strpos($message, 'bakso') !== false) {
    $response['text'] = "Finding comfort food: Soups, Soto & Bakso.";
    $response['query'] = 'soto bakso soup sayur kuah';
} 
elseif (strpos($message, 'coffee') !== false || strpos($message, 'kopi') !== false || strpos($message, 'drink') !== false) {
    $response['text'] = "Here are the best Coffee & Drinks.";
    $response['query'] = 'kopi teh es drink';
} 
elseif (strpos($message, 'cheap') !== false || strpos($message, 'budget') !== false || strpos($message, 'hemat') !== false) {
    $response['text'] = "Hunting for value. Top 3 Deals under 20k.";
    $response['query'] = 'cheap';
} 
elseif (strpos($message, 'spicy') !== false || strpos($message, 'pedas') !== false) {
    $response['text'] = "Warning: Hot & Spicy options selected.";
    $response['query'] = 'spicy pedas sambal geprek';
} 
else {
    $response['text'] = "Here are the Chef's Top Recommendations across all categories.";
    $response['query'] = 'all';
}

jsonResponse($response);
?>
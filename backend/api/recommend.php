<?php
require_once '../utils.php';

$input = json_decode(file_get_contents('php://input'), true);
$query = strtolower($input['query'] ?? 'all');
$keywords = explode(' ', $query);

$foods = readJson('../data/foods.json');
$restaurants = readJson('../data/restaurants.json');

// Map restaurants for easy lookup
$restMap = [];
foreach ($restaurants as $r) $restMap[$r['id']] = $r;

$rankedFoods = [];

foreach ($foods as $food) {
    $rest = $restMap[$food['restaurantId']];
    $score = 0;
    
    $fName = strtolower($food['name']);
    $fDesc = strtolower($food['desc']);
    $fTaste = strtolower($food['taste']);

    // --- SCORING ALGORITHM ---

    if ($query === 'all') {
        // Base score by rating
        $score = $rest['rating'] * 10;
    } elseif ($query === 'cheap') {
        // Price sensitive logic
        if ($food['price'] <= 15000) $score += 50;
        elseif ($food['price'] <= 25000) $score += 20;
        else $score -= 50; // Penalty for expensive items
        $score += ($rest['rating'] * 5); // Quality still matters
    } else {
        // Keyword Matching
        foreach ($keywords as $k) {
            if (empty($k)) continue;
            
            // Weighting: Name > Taste > Description
            if (strpos($fName, $k) !== false) $score += 30;
            elseif (strpos($fTaste, $k) !== false) $score += 15;
            elseif (strpos($fDesc, $k) !== false) $score += 5;
        }
        
        // Boost high-rated restaurants to break ties
        if ($score > 0) {
            $score += ($rest['rating'] * 5);
        }
    }

    // Include if valid
    if ($score > 0) {
        $food['restName'] = $rest['name'];
        $food['restType'] = $rest['type'];
        $food['rating'] = $rest['rating'];
        $food['score'] = $score;
        $rankedFoods[] = $food;
    }
}

// Sort by Score DESC
usort($rankedFoods, function($a, $b) {
    return $b['score'] <=> $a['score'];
});

// Return Top 3
$top3 = array_slice($rankedFoods, 0, 3);

jsonResponse(['results' => $top3]);
?>
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const cardsGrid = document.getElementById('cards-container');
const toast = document.getElementById('toast');

// Load default recommendations
window.onload = () => fetchRecommendations('all');

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerHTML = `<p>${text}</p>`;
    chatWindow.appendChild(div);
    
    // Smooth scroll to bottom
    requestAnimationFrame(() => {
        chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    });
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    userInput.value = '';

    try {
        const res = await fetch('../backend/api/chat.php', {
            method: 'POST',
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        
        addMessage(data.text, 'bot');
        
        // Always trigger recommendation engine
        if (data.action === 'recommend') {
            fetchRecommendations(data.query);
        }
    } catch (e) {
        addMessage("System offline.", 'bot');
    }
}

async function fetchRecommendations(query) {
    cardsGrid.innerHTML = '<div class="empty-state">Analyzing options...</div>';
    
    try {
        const res = await fetch('../backend/api/recommend.php', {
            method: 'POST',
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        renderTop3(data.results);
    } catch (e) {
        cardsGrid.innerHTML = '<div class="empty-state">Error fetching data.</div>';
    }
}

function renderTop3(foods) {
    cardsGrid.innerHTML = '';
    
    if (foods.length === 0) {
        cardsGrid.innerHTML = '<div class="empty-state">No matches found.</div>';
        return;
    }

    foods.forEach((food, index) => {
        const card = document.createElement('div');
        card.className = 'food-card';
        // Waterfall animation
        card.style.animation = `slideUp 0.5s ease ${index * 0.15}s forwards`;
        card.style.opacity = '0';

        card.innerHTML = `
            <div class="rank-badge">#${index + 1}</div>
            <div class="fc-info">
                <div class="fc-header-row">
                    <h3>${food.name}</h3>
                    <span class="rest-type">${food.restType}</span>
                </div>
                <div class="fc-rest">${food.restName} • ⭐ ${food.rating}</div>
                <div class="fc-desc">${food.desc}</div>
            </div>
            <div class="fc-actions">
                <div class="fc-price">Rp ${food.price.toLocaleString()}</div>
                <button class="order-btn" onclick="placeOrder('${food.id}', '${food.name}', ${food.price})">Select Option</button>
            </div>
        `;
        cardsGrid.appendChild(card);
    });
}

async function placeOrder(id, name, price) {
    const res = await fetch('../backend/api/order.php', {
        method: 'POST',
        body: JSON.stringify({ foodId: id, foodName: name, price: price })
    });
    
    if (res.ok) {
        showToast(`Selected: ${name}`);
        addMessage(`Excellent choice. I have confirmed your order for ${name}.`, 'bot');
    }
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function sendQuick(msg) {
    userInput.value = msg;
    handleSend();
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});
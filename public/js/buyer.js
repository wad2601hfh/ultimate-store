const stream = document.getElementById('chat-stream');
const cartBadge = document.getElementById('cart-count');
let cart = [];
let lastRenderedIndex = 0; // Fixed: Tracking index

setInterval(poll, 1000);

async function poll() {
    const res = await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'poll' }) });
    const data = await res.json();
    
    // Fixed: Only append new messages
    if (data.messages.length > lastRenderedIndex) {
        const newMessages = data.messages.slice(lastRenderedIndex);
        renderAppend(newMessages);
        lastRenderedIndex = data.messages.length;
    }
}

function renderAppend(messages) {
    messages.forEach(msg => {
        // *** HIDE AI HINTS FROM BUYER ***
        if (msg.type === 'ai_hint') return;

        const row = document.createElement('div');
        // Fixed: Add 'new-message' class for animation
        row.className = `msg-row ${msg.sender} new-message`;
        
        if (msg.type === 'text' || msg.type === 'system') {
            row.innerHTML = `<div class="bubble">${msg.text}</div>`;
        } else if (msg.type === 'card') {
            row.innerHTML = `
                <div class="card">
                    <span class="store-badge">RECOMMENDED</span>
                    <h3>${msg.foodName}</h3>
                    <span class="card-desc">${msg.desc}</span>
                    <span class="card-price">Rp ${parseInt(msg.price).toLocaleString()}</span>
                    <button class="add-btn" onclick="addToCart('${msg.foodName}', ${msg.price})">ADD +</button>
                </div>`;
        }
        stream.appendChild(row);
    });
    // Smooth Scroll
    stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
}

async function sendText() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    
    // Optimistic UI with new-message class
    const tempDiv = document.createElement('div');
    tempDiv.className = 'msg-row buyer new-message';
    tempDiv.innerHTML = `<div class="bubble">${text}</div>`;
    stream.appendChild(tempDiv);
    stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });

    await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'send_text', sender: 'buyer', text }) });
    // No manual poll() call needed, interval handles it
}

function addToCart(name, price) {
    cart.push({ name, price });
    cartBadge.innerText = cart.length;
    cartBadge.style.display = 'flex';
    // Animate
    const fab = document.querySelector('.cart-fab');
    fab.style.transform = "scale(1.2) rotate(10deg)";
    setTimeout(() => fab.style.transform = "scale(1) rotate(0deg)", 200);
}

function toggleModal(show) {
    const modal = document.getElementById('modal');
    if(show) { 
        if (cart.length === 0) return alert("Cart is empty.");
        renderCart(); 
        modal.classList.add('open'); 
    } else { 
        modal.classList.remove('open'); 
    }
}

function renderCart() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    let total = 0;
    list.innerHTML = '';
    cart.forEach(item => {
        total += item.price;
        list.innerHTML += `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #333"><span>${item.name}</span><span>Rp ${item.price.toLocaleString()}</span></div>`;
    });
    totalEl.innerText = `Rp ${total.toLocaleString()}`;
}

async function pay() {
    const btn = document.getElementById('pay-btn');
    btn.innerText = "PROCESSING...";
    btn.disabled = true;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    await new Promise(r => setTimeout(r, 1500));
    
    await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'place_order', items: cart, total }) });
    
    btn.innerText = "SUCCESS";
    btn.style.background = "var(--neon-green)";
    btn.style.color = "#000";

    setTimeout(() => {
        cart = [];
        cartBadge.innerText = '0';
        cartBadge.style.display = 'none';
        toggleModal(false);
        btn.innerText = "INITIATE TRANSFER";
        btn.style.background = "";
        btn.style.color = "#fff";
        btn.disabled = false;
    }, 1500);
}

document.getElementById('msg-input').addEventListener('keypress', (e) => { if(e.key==='Enter') sendText(); });
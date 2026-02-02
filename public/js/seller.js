const stream = document.getElementById('chat-stream');
let lastRenderedIndex = 0; // Fixed: Tracking index

loadMenu();
setInterval(poll, 1500);

// Load Sidebar Menu
async function loadMenu() {
    const res = await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'get_menu' }) });
    const data = await res.json();
    const list = document.getElementById('menu-list');
    
    const groups = {};
    data.menu.forEach(i => { if (!groups[i.category]) groups[i.category] = []; groups[i.category].push(i); });

    for (const [cat, items] of Object.entries(groups)) {
        const title = document.createElement('div');
        title.className = 'cat-title';
        title.innerText = cat;
        list.appendChild(title);
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'menu-item';
            row.innerHTML = `
                <div>
                    <strong style="color:#fff; font-size:0.9rem">${item.name}</strong><br>
                    <small style="color:#666">${item.store}</small>
                </div>
                <button class="push-btn" onclick="push('${item.name}', ${item.price}, '${item.desc}')">PUSH</button>
            `;
            list.appendChild(row);
        });
    }
}

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
        const row = document.createElement('div');
        // Fixed: Add 'new-message' class
        row.className = `msg-row ${msg.sender} new-message`; 
        
        // 1. STANDARD TEXT
        if (msg.type === 'text' || msg.type === 'system') {
            row.innerHTML = `<div class="bubble">${msg.text}</div>`;
        } 
        // 2. PUBLIC CARD (Visible to both)
        else if (msg.type === 'card') {
            row.innerHTML = `
                <div class="card" style="opacity:0.7; transform:scale(0.9)">
                    <span class="store-badge">YOU RECOMMENDED</span>
                    <h3>${msg.foodName}</h3>
                    <span class="card-price">Rp ${parseInt(msg.price).toLocaleString()}</span>
                </div>`;
        } 
        // 3. GHOST AI HINT (VISIBLE ONLY TO SELLER)
        else if (msg.type === 'ai_hint') {
            row.className = 'msg-row system new-message'; // Center align
            
            let suggestionsHTML = '';
            msg.matches.forEach(m => {
                suggestionsHTML += `
                    <div class="suggestion-chip" onclick="push('${m.name}', ${m.price}, '${m.desc}')">
                        <span style="display:block; font-weight:bold">${m.name}</span>
                        <span style="font-size:0.8rem">Rp ${m.price.toLocaleString()}</span>
                        <div class="glow-hover">PUSH ➔</div>
                    </div>
                `;
            });

            row.innerHTML = `
                <div class="ai-suggestion-box">
                    <div style="color:var(--neon-green); font-size:0.7rem; margin-bottom:10px; font-weight:bold; letter-spacing:1px;">
                        ⚡ AI DETECTED INTENT: "${msg.trigger}"
                    </div>
                    <div class="suggestion-grid">
                        ${suggestionsHTML}
                    </div>
                </div>
            `;
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
    
    // Optimistic UI
    const tempDiv = document.createElement('div');
    tempDiv.className = 'msg-row seller new-message';
    tempDiv.innerHTML = `<div class="bubble">${text}</div>`;
    stream.appendChild(tempDiv);
    stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });

    await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'send_text', sender: 'seller', text }) });
}

async function push(name, price, desc) {
    await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'send_card', foodName: name, price, desc }) });
    // No manual poll needed, interval handles it
}

document.getElementById('msg-input').addEventListener('keypress', (e) => { if(e.key==='Enter') sendText(); });
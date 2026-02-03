const stream = document.getElementById('chat-stream');
let lastRenderedIndex = 0;
let isInitialLoad = true;

// Init
loadMenu();
setInterval(poll, 1500);

// 1. SIDEBAR MENU GROUPED BY STORE
async function loadMenu() {
    const res = await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'get_menu' }) });
    const data = await res.json();
    const list = document.getElementById('menu-list');
    
    // Grouping
    const stores = {};
    data.menu.forEach(i => { 
        if (!stores[i.store]) stores[i.store] = []; 
        stores[i.store].push(i); 
    });

    for (const [storeName, items] of Object.entries(stores)) {
        const title = document.createElement('div');
        title.className = 'cat-title';
        title.innerText = `🏪 ${storeName}`;
        list.appendChild(title);

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'menu-item';
            row.innerHTML = `
                <div>
                    <strong style="color:#fff; font-size:0.9rem">${item.name}</strong><br>
                    <small style="color:#666">Rp ${item.price.toLocaleString()}</small>
                </div>
                <button class="push-btn" onclick="push('${item.name}', ${item.price}, '${item.desc}')">PUSH</button>
            `;
            list.appendChild(row);
        });
    }
}

// 2. POLLING
async function poll() {
    const res = await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'poll' }) });
    const data = await res.json();
    
    if (data.messages.length > lastRenderedIndex) {
        const newMessages = data.messages.slice(lastRenderedIndex);
        renderAppend(newMessages);
        lastRenderedIndex = data.messages.length;
        isInitialLoad = false;
    }
}

function renderAppend(messages) {
    messages.forEach(msg => {
        const row = document.createElement('div');
        const animationClass = isInitialLoad ? '' : 'new-message';
        row.className = `msg-row ${msg.sender} ${animationClass}`;
        
        if (msg.type === 'text' || msg.type === 'system') {
            row.innerHTML = `<div class="bubble">${msg.text}</div>`;
        } 
        else if (msg.type === 'card') {
            row.innerHTML = `
                <div class="card" style="opacity:0.7; transform:scale(0.9)">
                    <span class="store-badge">YOU RECOMMENDED</span>
                    <h3>${msg.foodName}</h3>
                    <span class="card-price">Rp ${parseInt(msg.price).toLocaleString()}</span>
                </div>`;
        } 
        // RENDER GHOST AI BOX
        else if (msg.type === 'ai_hint') {
            row.className = `msg-row system ${animationClass}`;
            
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
                    <div class="suggestion-grid">${suggestionsHTML}</div>
                </div>`;
        }
        stream.appendChild(row);
    });

    if (isInitialLoad) stream.scrollTop = stream.scrollHeight;
    else stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
}

// 3. SENDING (FIXED: No double messages)
async function sendText() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;
    
    // Clear Input
    input.value = '';

    // Send to backend
    await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'send_text', sender: 'seller', text }) });
    
    // Force Update
    poll();
}

async function push(name, price, desc) {
    await fetch('../backend/api/chat.php', { method: 'POST', body: JSON.stringify({ action: 'send_card', foodName: name, price, desc }) });
    poll();
}

document.getElementById('msg-input').addEventListener('keypress', (e) => { if(e.key==='Enter') sendText(); });
(function() {

  const WORKER_URL = 'https://cryptocardpro.esem39.workers.dev';

  function parseMarkdown(text) {
    if (!text) return '';
    let t = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    t = t.replace(/\*\*([^*]+):\*\*/g, (m,h) => {
      const colors = ['#f59e0b','#2563eb','#10b981','#7c3aed','#ef4444','#0891b2'];
      const c = colors[Math.abs(h.charCodeAt(0)) % colors.length];
      return '<div style="margin:10px 0 4px;padding:6px 12px;background:'+c+'18;border-left:3px solid '+c+';border-radius:0 8px 8px 0;font-weight:700;font-size:12px;color:'+c+'">'+h+'</div>';
    });
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.+?)\*/g, '<em style="color:#94a3b8">$1</em>');
    let num = 0;
    t = t.replace(/(?:^|\n)(\d+)\.\s+(.+)/g, (m,n,item) => {
      num++;
      const colors = ['#f59e0b','#2563eb','#10b981','#7c3aed','#ef4444','#0891b2'];
      const c = colors[(num-1) % colors.length];
      return '<div style="display:flex;gap:10px;align-items:baseline;margin:4px 0;padding:6px 10px;background:'+c+'10;border-radius:8px;border:1px solid '+c+'25"><span style="background:'+c+';color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">'+num+'</span><span>'+item+'</span></div>';
    });
    t = t.replace(/(?:^|\n)[-•]\s+(.+)/g, (m,item) => '<div style="display:flex;gap:8px;align-items:baseline;margin:3px 0;padding:4px 8px;background:#1e293b;border-radius:6px"><span style="color:#f59e0b;font-weight:700;flex-shrink:0">›</span><span>'+item+'</span></div>');
    t = t.replace(/`(.+?)`/g, '<code style="background:#1e293b;color:#f59e0b;padding:1px 6px;border-radius:4px;font-size:11px;font-family:monospace">$1</code>');
    t = t.replace(/\n/g, '<br>');
    return t;
  }

  const styles = `
    #cc-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 62px; height: 62px; border-radius: 50%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: none; cursor: pointer;
      box-shadow: 0 4px 24px rgba(245,158,11,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; transition: transform 0.2s;
    }
    #cc-btn:hover { transform: scale(1.1); }
    #cc-chat {
      position: fixed; bottom: 100px; right: 24px; z-index: 9999;
      width: 370px; height: 680px;
      background: #0f172a; border-radius: 20px;
      box-shadow: 0 8px 48px rgba(0,0,0,0.6);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      border: 1px solid rgba(245,158,11,0.2);
    }
    #cc-chat.open { display: flex; }
    .cc-header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border-bottom: 1px solid rgba(245,158,11,0.2);
      padding: 16px 18px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .cc-header-left { display: flex; align-items: center; gap: 10px; }
    .cc-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .cc-title { font-weight: 700; font-size: 15px; color: #fff; }
    .cc-subtitle { font-size: 11px; color: #64748b; }
    .cc-close { background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; }
    .cc-close:hover { color: #fff; }
    .cc-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      scrollbar-width: thin; scrollbar-color: #1e293b #0f172a;
    }
    .cc-msg { display: flex; gap: 8px; }
    .cc-msg.user { flex-direction: row-reverse; }
    .cc-msg-av {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; color: #fff;
    }
    .cc-msg.user .cc-msg-av { background: #1e293b; color: #94a3b8; }
    .cc-bubble {
      max-width: 275px; padding: 10px 14px; border-radius: 16px;
      font-size: 13px; line-height: 1.55; color: #e2e8f0;
      background: #1e293b; border: 1px solid rgba(255,255,255,0.05);
    }
    .cc-msg.user .cc-bubble {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff; border: none; border-radius: 16px 16px 4px 16px;
    }
    .cc-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px; }
    .cc-typing span { width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; animation: cc-bounce 1.2s infinite; }
    .cc-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cc-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cc-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
    .cc-input-area {
      padding: 12px 14px; border-top: 1px solid rgba(245,158,11,0.15);
      display: flex; gap: 8px; align-items: flex-end; background: #0f172a;
    }
    .cc-mic {
      width: 36px; height: 36px; border-radius: 50%;
      border: 2px solid rgba(245,158,11,0.4); background: #1e293b;
      color: #f59e0b; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 15px;
      transition: all 0.2s;
    }
    .cc-mic:hover { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
    .cc-mic.listening { background: #f59e0b; color: #fff; border-color: #f59e0b; animation: cc-pulse 1s infinite; }
    @keyframes cc-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 50%{box-shadow:0 0 0 8px rgba(245,158,11,0)} }
    .cc-input {
      flex: 1; background: #1e293b; border: 1px solid rgba(245,158,11,0.2);
      border-radius: 12px; padding: 8px 12px;
      font-size: 13px; color: #e2e8f0; outline: none; resize: none;
      font-family: inherit; line-height: 1.4; max-height: 80px;
    }
    .cc-input::placeholder { color: #475569; }
    .cc-input:focus { border-color: rgba(245,158,11,0.5); }
    .cc-send {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; transition: transform 0.2s;
    }
    .cc-send:hover { transform: scale(1.1); }
    .cc-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .cc-disclaimer {
      text-align: center; font-size: 10px; color: #334155;
      padding: 6px 14px; background: #0f172a;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const btn = document.createElement('button');
  btn.id = 'cc-btn';
  btn.innerHTML = '₿';
  btn.title = 'CryptoCard AI — эксперт по Bybit';
  document.body.appendChild(btn);

  const chat = document.createElement('div');
  chat.id = 'cc-chat';
  chat.innerHTML = `
    <div class="cc-header">
      <div class="cc-header-left">
        <div class="cc-avatar">₿</div>
        <div>
          <div class="cc-title">CryptoCard AI</div>
          <div class="cc-subtitle">Bybit · Крипто-карты · DeFi</div>
        </div>
      </div>
      <button class="cc-close">✕</button>
    </div>
    <div class="cc-messages"></div>
    <div class="cc-disclaimer">⚠️ Не является финансовым советом</div>
    <div class="cc-input-area">
      <button class="cc-mic" title="Голосовой ввод">🎤</button>
      <textarea class="cc-input" placeholder="Спросите про Bybit, карты, крипту..." rows="1"></textarea>
      <button class="cc-send">➤</button>
    </div>
  `;
  document.body.appendChild(chat);

  const messages = chat.querySelector('.cc-messages');
  const input = chat.querySelector('.cc-input');
  const sendBtn = chat.querySelector('.cc-send');
  const micBtn = chat.querySelector('.cc-mic');
  let history = [];
  let opened = false;

  function addMsg(role, text) {
    const div = document.createElement('div');
    div.className = `cc-msg ${role}`;
    const av = document.createElement('div');
    av.className = 'cc-msg-av';
    av.textContent = role === 'user' ? '👤' : '₿';
    const bubble = document.createElement('div');
    bubble.className = 'cc-bubble';
    bubble.innerHTML = parseMarkdown(text);
    div.appendChild(av);
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'cc-msg bot';
    div.innerHTML = `<div class="cc-msg-av">₿</div><div class="cc-bubble cc-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  async function send(text) {
    if (!text.trim() || sendBtn.disabled) return;
    addMsg('user', text);
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    history.push({ role: 'user', content: text });
    const typing = showTyping();
    try {
      const res = await fetch(`${WORKER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      typing.remove();
      const reply = data.response || 'Произошла ошибка.';
      addMsg('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch(e) {
      typing.remove();
      addMsg('bot', 'Ошибка соединения. Попробуйте позже.');
    }
    sendBtn.disabled = false;
  }

  btn.addEventListener('click', () => {
    chat.classList.toggle('open');
    if (!opened) {
      opened = true;
      addMsg('bot', 'Привет! Я CryptoCard AI 💛\n\nПомогу разобраться с:\n\n1. Bybit Card — как получить, пополнить, кэшбэк\n2. Bybit биржа — торговля, P2P, фьючерсы\n3. Купить крипту — BTC, ETH, USDT за фиат\n4. Вывод средств — карты, банк, P2P\n5. Безопасность — 2FA, защита аккаунта\n6. DeFi — стейкинг, Earn, пассивный доход\n\nЗадайте ваш вопрос 👇');
    }
  });

  chat.querySelector('.cc-close').addEventListener('click', () => {
    chat.classList.remove('open');
  });

  sendBtn.addEventListener('click', () => send(input.value));

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  // Микрофон
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      input.value = e.results[0][0].transcript;
      micBtn.classList.remove('listening');
      send(input.value);
    };
    recognition.onend = () => micBtn.classList.remove('listening');
    recognition.onerror = () => micBtn.classList.remove('listening');
    micBtn.addEventListener('click', () => {
      micBtn.classList.add('listening');
      recognition.start();
    });
  } else {
    micBtn.style.display = 'none';
  }

})();

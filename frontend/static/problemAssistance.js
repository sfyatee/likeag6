(() => {
  const chatEl = document.getElementById('chatMessages');
  const promptEl = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const errEl = document.getElementById('err');

  const messages = []; // {role, content}

  function addMsg(role, content) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = content;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  async function send() {
    errEl.textContent = '';
    const text = (promptEl.value || '').trim();
    if (!text) return;

    addMsg('user', text);
    messages.push({ role: 'user', content: text });
    promptEl.value = '';
    sendBtn.disabled = true;

    try {
      const res = await fetch('/api/assist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const answer = data.answer || '(no answer)';
      addMsg('assistant', answer);
      messages.push({ role: 'assistant', content: answer });

    } catch (e) {
      errEl.textContent = e?.message ? e.message : String(e);
    } finally {
      sendBtn.disabled = false;
      promptEl.focus();
    }
  }

  sendBtn?.addEventListener('click', send);

  promptEl?.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Cmd+Enter sends
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  });

  clearBtn?.addEventListener('click', () => {
    messages.length = 0;
    chatEl.innerHTML = '';
    errEl.textContent = '';
    addMsg('assistant',
      'Hi! Ask me a linear algebra question.\n' +
      'Example: "Compute A×B where A=[[1,2],[3,4]] and B=[[5,6],[7,8]] and explain the steps."'
    );
  });

  // initial greeting
  addMsg('assistant',
    'Hi! Ask me a linear algebra question.\n' +
    'Example: "Compute RREF of A=[[1,2],[3,4]] and explain pivots."'
  );
})();
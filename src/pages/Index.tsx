import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { apiGetChats, apiCreateChat, apiGetMessages, apiSendMessage, apiGetContacts } from '@/lib/api';

type Section = 'chats' | 'contacts' | 'profile' | 'settings' | 'search' | 'archive' | 'secret';

interface RealMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  text: string;
  time: string;
  mine: boolean;
}

interface RealChat {
  id: number;
  partner_id: number;
  partner_username: string;
  partner_name: string;
  last_msg: string;
  last_time: string;
  unread: number;
}

interface Contact {
  id: number;
  username: string;
  display_name: string;
}

const NAV_ITEMS = [
  { id: 'chats' as Section, icon: 'MessageSquare', label: 'Чаты' },
  { id: 'search' as Section, icon: 'Search', label: 'Поиск' },
  { id: 'contacts' as Section, icon: 'Users', label: 'Контакты' },
  { id: 'archive' as Section, icon: 'Archive', label: 'Архив' },
  { id: 'secret' as Section, icon: 'ShieldCheck', label: 'Закрытые' },
  { id: 'profile' as Section, icon: 'User', label: 'Профиль' },
  { id: 'settings' as Section, icon: 'Settings', label: 'Настройки' },
];

const SECRET_CHATS = [
  { id: 9001, partner_name: 'Засекреченный', partner_username: 'secret1', last_msg: '••••••••••', last_time: '08:01' },
  { id: 9002, partner_name: 'Проект Тень', partner_username: 'shadow', last_msg: '••••••', last_time: 'вчера' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function AvatarBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-20 h-20 text-xl' };
  return (
    <div className={`${sizeMap[size]} rounded-xl flex-shrink-0 flex items-center justify-center font-display font-semibold bg-gradient-to-br from-dark-card to-dark-panel border border-dark-border text-neon-green`}>
      {initials(name)}
    </div>
  );
}

function EncryptBadge() {
  return (
    <span className="flex items-center gap-0.5 text-neon-green opacity-70">
      <Icon name="Lock" size={10} />
      <span className="font-mono text-[9px]">E2E</span>
    </span>
  );
}

/* ─────────── CHAT WINDOW ─────────── */
function ChatWindow({ chat, myId }: { chat: RealChat | null; myId: number }) {
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = async (chatId: number) => {
    const data = await apiGetMessages(chatId);
    if (data.messages) setMessages(data.messages);
  };

  useEffect(() => {
    if (!chat) { setMessages([]); return; }
    setLoading(true);
    loadMessages(chat.id).finally(() => setLoading(false));

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(chat.id), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [chat?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-2">
          <Icon name="MessageSquare" size={36} className="text-neon-green opacity-40" />
        </div>
        <p className="font-display text-2xl text-white opacity-30 tracking-widest uppercase">Выберите чат</p>
        <p className="text-xs text-gray-600 font-mono">Все сообщения защищены E2E шифрованием</p>
      </div>
    );
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const optimistic: RealMessage = {
      id: Date.now(), sender_id: myId, sender_name: 'Я', text,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }), mine: true,
    };
    setMessages(prev => [...prev, optimistic]);
    await apiSendMessage(chat.id, text);
    await loadMessages(chat.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-dark-border bg-dark-panel/60 backdrop-blur-sm">
        <AvatarBadge name={chat.partner_name} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{chat.partner_name}</span>
            <span className="flex items-center gap-1 bg-neon-green/10 border border-neon-green/30 rounded-full px-2 py-0.5">
              <Icon name="ShieldCheck" size={10} className="text-neon-green" />
              <span className="text-[10px] font-mono text-neon-green">ЗАШИФРОВАНО</span>
            </span>
          </div>
          <span className="text-xs text-gray-500">@{chat.partner_username}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg hover:bg-dark-card flex items-center justify-center transition-colors">
            <Icon name="Phone" size={16} className="text-gray-500" />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-dark-card flex items-center justify-center transition-colors">
            <Icon name="Video" size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="mx-4 mt-3 mb-1 flex items-center justify-center gap-2 bg-neon-green/5 border border-neon-green/15 rounded-xl py-1.5">
        <Icon name="Lock" size={12} className="text-neon-green encrypt-spin" />
        <span className="text-[11px] font-mono text-neon-green/70">Сквозное шифрование активно</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={20} className="text-neon-green/40 animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <Icon name="MessageSquare" size={24} className="text-gray-700" />
            <p className="text-xs text-gray-600">Напишите первое сообщение</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} msg-pop`}>
            <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${msg.mine
              ? 'bg-gradient-to-br from-neon-green/20 to-neon-green/8 border border-neon-green/25 rounded-tr-sm'
              : 'bg-dark-card border border-dark-border rounded-tl-sm'
            }`}>
              {!msg.mine && (
                <p className="text-[10px] text-neon-green/60 font-mono mb-0.5">{msg.sender_name}</p>
              )}
              <p className="text-sm text-white leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <Icon name="Lock" size={9} className="text-neon-green/40" />
                <span className="text-[10px] font-mono text-gray-600">{msg.time}</span>
                {msg.mine && <Icon name="CheckCheck" size={12} className="text-neon-green status-appear" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-2xl px-3 py-2 focus-within:border-neon-green/40 transition-colors">
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-panel transition-colors flex-shrink-0">
            <Icon name="Paperclip" size={16} className="text-gray-500" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Зашифрованное сообщение..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none font-sans"
          />
          <button
            onClick={handleSend}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-neon-green hover:bg-neon-green/80 transition-colors flex-shrink-0"
          >
            <Icon name="Send" size={14} className="text-dark-bg" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── CHATS LIST ─────────── */
function ChatsSection({ onSelect, selected }: { onSelect: (c: RealChat) => void; selected: RealChat | null }) {
  const [chats, setChats] = useState<RealChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState('');

  const loadChats = () => apiGetChats().then(d => { if (d.chats) setChats(d.chats); });

  useEffect(() => {
    loadChats().finally(() => setLoading(false));
    const t = setInterval(loadChats, 6000);
    return () => clearInterval(t);
  }, []);

  const handleCreate = async () => {
    if (!newUsername.trim()) return;
    setCreating(true); setErr('');
    const data = await apiCreateChat(newUsername.trim());
    setCreating(false);
    if (data.error) { setErr(data.error); return; }
    setShowNew(false); setNewUsername('');
    await loadChats();
    if (data.chat_id) {
      const fresh = await apiGetChats();
      const found = fresh.chats?.find((c: RealChat) => c.id === data.chat_id);
      if (found) onSelect(found);
    }
  };

  return (
    <>
      <div className="px-4 pt-5 pb-3 border-b border-dark-border flex items-center justify-between">
        <p className="font-display text-lg text-white uppercase tracking-widest">Чаты</p>
        <button
          onClick={() => { setShowNew(v => !v); setErr(''); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors"
        >
          <Icon name={showNew ? 'X' : 'Plus'} size={14} className="text-neon-green" />
        </button>
      </div>

      {showNew && (
        <div className="px-3 py-2 border-b border-dark-border animate-fade-in">
          <div className="flex gap-2">
            <input
              value={newUsername}
              onChange={e => { setNewUsername(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="@username собеседника"
              className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-neon-green/40 font-mono"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-3 py-2 rounded-xl bg-neon-green text-dark-bg text-sm font-semibold hover:bg-neon-green/80 transition-colors disabled:opacity-50"
            >
              {creating ? '...' : 'OK'}
            </button>
          </div>
          {err && <p className="text-xs text-destructive mt-1 px-1">{err}</p>}
        </div>
      )}

      <div className="mx-3 my-2 flex items-center gap-1.5 bg-neon-green/5 border border-neon-green/15 rounded-lg px-3 py-1.5">
        <Icon name="Lock" size={11} className="text-neon-green encrypt-spin" />
        <span className="text-[10px] font-mono text-neon-green/60">Все чаты защищены E2E</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={18} className="text-neon-green/40 animate-spin" />
          </div>
        )}
        {!loading && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
            <Icon name="MessageSquarePlus" size={28} className="text-gray-700" />
            <p className="text-sm text-gray-600">Нет чатов. Нажмите + чтобы начать</p>
          </div>
        )}
        {chats.map((chat, i) => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-dark-card border-b border-dark-border/40 animate-fade-in ${selected?.id === chat.id ? 'bg-dark-card border-l-2 border-l-neon-green' : ''}`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <AvatarBadge name={chat.partner_name} />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white truncate">{chat.partner_name}</span>
                <span className="text-[10px] text-gray-500 font-mono ml-2 flex-shrink-0">{chat.last_time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-gray-500 truncate">{chat.last_msg || 'Нет сообщений'}</span>
                <div className="flex items-center gap-1 ml-2">
                  <EncryptBadge />
                  {chat.unread > 0 && (
                    <span className="bg-neon-green text-dark-bg text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ─────────── CONTACTS ─────────── */
function ContactsSection({ onStartChat }: { onStartChat: (username: string) => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    apiGetContacts().then(d => { if (d.users) setContacts(d.users); }).finally(() => setLoading(false));
  }, []);

  const filtered = q ? contacts.filter(c =>
    c.display_name.toLowerCase().includes(q.toLowerCase()) ||
    c.username.toLowerCase().includes(q.toLowerCase())
  ) : contacts;

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest mb-3">Контакты</p>
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl px-3 py-2 focus-within:border-neon-green/40 transition-colors">
          <Icon name="Search" size={14} className="text-gray-600" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск..." className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading && <div className="flex justify-center py-8"><Icon name="Loader2" size={18} className="text-neon-green/40 animate-spin" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Icon name="Users" size={24} className="text-gray-700" />
            <p className="text-xs text-gray-600">{q ? 'Никого не найдено' : 'Пока нет пользователей'}</p>
          </div>
        )}
        {filtered.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-dark-border/30 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
            <AvatarBadge name={c.display_name} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{c.display_name}</p>
              <p className="text-xs font-mono text-gray-500">@{c.username}</p>
            </div>
            <button
              onClick={() => onStartChat(c.username)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors"
            >
              <Icon name="MessageSquare" size={14} className="text-neon-green" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── SEARCH ─────────── */
function SearchSection({ onStartChat }: { onStartChat: (username: string) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      apiGetContacts(q).then(d => { if (d.users) setResults(d.users); }).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest mb-3">Поиск</p>
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl px-3 py-2.5 focus-within:border-neon-green/40 transition-colors">
          <Icon name="Search" size={16} className="text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Пользователи..." className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" autoFocus />
          {q && <button onClick={() => setQ('')}><Icon name="X" size={14} className="text-gray-500" /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {!q && <div className="flex flex-col items-center justify-center h-40 gap-2"><Icon name="Search" size={28} className="text-gray-700" /><p className="text-sm text-gray-600">Начните вводить для поиска</p></div>}
        {loading && <div className="flex justify-center py-8"><Icon name="Loader2" size={18} className="text-neon-green/40 animate-spin" /></div>}
        {!loading && q && results.length === 0 && <div className="flex flex-col items-center justify-center h-40 gap-2"><Icon name="SearchX" size={28} className="text-gray-700" /><p className="text-sm text-gray-600">Никого не найдено</p></div>}
        {results.map(c => (
          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-dark-border/30 animate-fade-in">
            <AvatarBadge name={c.display_name} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{c.display_name}</p>
              <p className="text-xs font-mono text-gray-500">@{c.username}</p>
            </div>
            <button onClick={() => onStartChat(c.username)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors">
              <Icon name="MessageSquare" size={14} className="text-neon-green" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── ARCHIVE (static) ─────────── */
function ArchiveSection() {
  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest">Архив</p>
        <p className="text-xs text-gray-600 mt-0.5">Архивированные диалоги</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
        <Icon name="Archive" size={28} className="text-gray-700" />
        <p className="text-sm text-gray-600">Архив пуст</p>
        <p className="text-xs text-gray-700">Смахните чат влево, чтобы архивировать</p>
      </div>
    </div>
  );
}

/* ─────────── SECRET CHATS ─────────── */
function SecretSection() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');

  if (!unlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center">
          <Icon name="ShieldCheck" size={28} className="text-neon-purple" />
        </div>
        <div className="text-center">
          <p className="font-display text-xl text-white uppercase tracking-widest">Закрытые чаты</p>
          <p className="text-xs text-gray-600 mt-1">Введите PIN-код для доступа</p>
        </div>
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-mono text-xl text-white transition-all ${pin.length >= i ? 'border-neon-purple bg-neon-purple/10' : 'border-dark-border bg-dark-card'}`}>
              {pin.length >= i ? '●' : ''}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 w-44">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, i) => (
            <button
              key={i}
              onClick={() => {
                if (k === '⌫') setPin(p => p.slice(0, -1));
                else if (k !== '' && pin.length < 4) {
                  const np = pin + k;
                  setPin(np);
                  if (np.length === 4) setTimeout(() => { setUnlocked(true); setPin(''); }, 300);
                }
              }}
              className={`h-12 rounded-xl font-mono text-lg font-semibold transition-all ${k === '' ? 'pointer-events-none' : 'bg-dark-card border border-dark-border text-white hover:border-neon-purple/50 hover:text-neon-purple active:scale-95'}`}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-gray-700">Введите любой PIN для демо</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border flex items-center justify-between">
        <div>
          <p className="font-display text-lg text-white uppercase tracking-widest">Закрытые чаты</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Icon name="ShieldCheck" size={11} className="text-neon-purple" />
            <span className="text-[10px] font-mono text-neon-purple/70">Максимальная защита</span>
          </div>
        </div>
        <button onClick={() => setUnlocked(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-neon-purple/10 border border-neon-purple/30 hover:bg-neon-purple/20 transition-colors">
          <Icon name="Lock" size={14} className="text-neon-purple" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {SECRET_CHATS.map(chat => (
          <div key={chat.id} className="flex items-center gap-3 px-4 py-3 border-b border-dark-border/40 hover:bg-dark-card transition-colors cursor-pointer">
            <AvatarBadge name={chat.partner_name} />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">{chat.partner_name}</span>
                <span className="text-[10px] font-mono text-gray-600">{chat.last_time}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-600 font-mono">{chat.last_msg}</span>
                <EncryptBadge />
              </div>
            </div>
          </div>
        ))}
        <div className="px-4 py-4 mx-4 mt-4 bg-neon-purple/5 border border-neon-purple/15 rounded-xl">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={14} className="text-neon-purple mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">Закрытые чаты используют военный стандарт шифрования. Сообщения не хранятся на серверах.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── PROFILE ─────────── */
function ProfileSection({ user, onLogout }: { user: IndexProps['user']; onLogout: () => void }) {
  const ini = initials(user.display_name);
  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-y-auto">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest">Профиль</p>
      </div>
      <div className="px-4 py-6 flex flex-col items-center gap-4 border-b border-dark-border">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border-2 border-neon-green/40 flex items-center justify-center text-2xl font-display font-bold text-neon-green animate-pulse-glow">
            {ini}
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{user.display_name}</p>
          <p className="text-xs font-mono text-neon-green/70">@{user.username}</p>
        </div>
        <div className="flex items-center gap-2 bg-neon-green/5 border border-neon-green/20 rounded-xl px-4 py-2">
          <Icon name="ShieldCheck" size={14} className="text-neon-green" />
          <span className="text-xs font-mono text-neon-green">Аккаунт верифицирован</span>
        </div>
      </div>
      <div className="px-4 py-4 flex-1" />
      <div className="px-4 pb-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors text-sm text-destructive"
        >
          <Icon name="LogOut" size={14} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

/* ─────────── SETTINGS ─────────── */
function SettingsSection() {
  const [settings, setSettings] = useState({ e2e: true, notifications: true, readReceipts: true, online: true, biometric: false, autoDelete: false });
  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const groups: { title: string; icon: string; items: { key: string; label: string; desc: string }[] }[] = [
    { title: 'Безопасность', icon: 'Shield', items: [
      { key: 'e2e', label: 'Сквозное шифрование', desc: 'E2E для всех сообщений' },
      { key: 'biometric', label: 'Биометрия', desc: 'Вход по отпечатку / Face ID' },
      { key: 'autoDelete', label: 'Автоудаление', desc: 'Сообщения удаляются через 24ч' },
    ]},
    { title: 'Приватность', icon: 'EyeOff', items: [
      { key: 'readReceipts', label: 'Уведомления о прочтении', desc: 'Показывать статус прочтения' },
      { key: 'online', label: 'Статус онлайн', desc: 'Показывать когда вы в сети' },
    ]},
    { title: 'Уведомления', icon: 'Bell', items: [
      { key: 'notifications', label: 'Push-уведомления', desc: 'Уведомления о новых сообщениях' },
    ]},
  ];

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-y-auto">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest">Настройки</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-4">
        {groups.map(group => (
          <div key={group.title} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border/60">
              <Icon name={group.icon} size={14} className="text-neon-green" />
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{group.title}</span>
            </div>
            {group.items.map(item => (
              <div key={item.key} className="flex items-center justify-between px-4 py-3 border-b border-dark-border/30 last:border-b-0">
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-[11px] text-gray-600">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key as keyof typeof settings)}
                  className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${settings[item.key as keyof typeof settings] ? 'bg-neon-green' : 'bg-dark-border'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-dark-bg transition-all duration-300 ${settings[item.key as keyof typeof settings] ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        ))}
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-panel transition-colors">
            <Icon name="HelpCircle" size={16} className="text-gray-500" />
            <span className="text-sm text-gray-500">Помощь</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── ROOT ─────────── */
interface IndexProps {
  user: { id: number; username: string; display_name: string };
  onLogout: () => void;
}

export default function Index({ user, onLogout }: IndexProps) {
  const [section, setSection] = useState<Section>('chats');
  const [selectedChat, setSelectedChat] = useState<RealChat | null>(null);

  const ini = initials(user.display_name);
  const showChatWindow = section === 'chats' || section === 'archive' || section === 'secret';

  const handleStartChat = async (username: string) => {
    const data = await apiCreateChat(username);
    if (data.chat_id) {
      const fresh = await apiGetChats();
      const found = fresh.chats?.find((c: RealChat) => c.id === data.chat_id);
      if (found) { setSelectedChat(found); setSection('chats'); }
    }
  };

  return (
    <div className="h-screen w-screen flex bg-dark-bg grid-bg overflow-hidden noise-bg">
      <div className="scanline" />

      <nav className="w-16 flex flex-col items-center py-4 gap-1 border-r border-dark-border bg-dark-panel/80 backdrop-blur-sm z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border border-neon-green/30 flex items-center justify-center mb-3">
          <Icon name="Zap" size={18} className="text-neon-green" />
        </div>

        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setSection(item.id); if (item.id !== 'chats') setSelectedChat(null); }}
            title={item.label}
            className={`group w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
              section === item.id ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green' : 'text-gray-600 hover:text-gray-300 hover:bg-dark-card'
            }`}
          >
            <Icon name={item.icon} size={18} />
            {section === item.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-green rounded-r-full" />}
            <span className="absolute left-14 bg-dark-card border border-dark-border text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          </button>
        ))}

        <div className="mt-auto flex flex-col items-center gap-1">
          <button
            onClick={() => setSection('profile')}
            title={user.display_name}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 border border-neon-green/30 flex items-center justify-center text-xs font-display font-bold text-neon-green hover:border-neon-green transition-colors"
          >
            {ini}
          </button>
          <button onClick={onLogout} title="Выйти" className="w-9 h-9 rounded-xl hover:bg-dark-card flex items-center justify-center transition-colors">
            <Icon name="LogOut" size={14} className="text-gray-600 hover:text-destructive transition-colors" />
          </button>
        </div>
      </nav>

      <div className="w-72 flex flex-col border-r border-dark-border bg-dark-panel/50">
        {section === 'chats' && <ChatsSection onSelect={setSelectedChat} selected={selectedChat} />}
        {section === 'search' && <SearchSection onStartChat={handleStartChat} />}
        {section === 'contacts' && <ContactsSection onStartChat={handleStartChat} />}
        {section === 'profile' && <ProfileSection user={user} onLogout={onLogout} />}
        {section === 'archive' && <ArchiveSection />}
        {section === 'secret' && <SecretSection />}
        {section === 'settings' && <SettingsSection />}
      </div>

      <div className="flex-1 flex flex-col bg-dark-bg relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-neon-green/3 blur-3xl" />
          <div className="absolute bottom-32 left-10 w-48 h-48 rounded-full bg-neon-purple/3 blur-3xl" />
        </div>

        {showChatWindow
          ? <ChatWindow chat={selectedChat} myId={user.id} />
          : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center">
                <Icon name="Zap" size={28} className="text-neon-green opacity-30" />
              </div>
              <p className="font-display text-3xl text-white/20 tracking-widest uppercase">CipherTalk</p>
              <p className="text-xs text-gray-700 font-mono">Защищённый мессенджер</p>
            </div>
          )
        }
      </div>
    </div>
  );
}

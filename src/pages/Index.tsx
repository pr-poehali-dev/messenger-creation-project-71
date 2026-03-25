import { useState } from 'react';
import Icon from '@/components/ui/icon';

type Section = 'chats' | 'contacts' | 'profile' | 'settings' | 'search' | 'archive' | 'secret';

interface Message {
  id: number;
  text: string;
  time: string;
  mine: boolean;
  encrypted?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread?: number;
  online?: boolean;
  encrypted?: boolean;
  archived?: boolean;
  secret?: boolean;
}

const CHATS: Chat[] = [
  { id: 1, name: 'Алиса Громова', avatar: 'АГ', lastMsg: 'Окей, встретимся завтра 🔐', time: '14:22', unread: 3, online: true, encrypted: true },
  { id: 2, name: 'Команда Альфа', avatar: '⚡', lastMsg: 'Файлы отправлены по защищённому каналу', time: '13:45', unread: 1, encrypted: true },
  { id: 3, name: 'Денис Волков', avatar: 'ДВ', lastMsg: 'Когда дедлайн?', time: '12:10', online: true },
  { id: 4, name: 'Маяк.Проект', avatar: '🔭', lastMsg: 'Обновил документацию', time: '11:33', unread: 7 },
  { id: 5, name: 'Лена Морозова', avatar: 'ЛМ', lastMsg: 'Спасибо!', time: 'вчера', online: false },
  { id: 6, name: 'Виктор Орлов', avatar: 'ВО', lastMsg: 'Посмотри схему', time: 'вчера' },
];

const ARCHIVED: Chat[] = [
  { id: 7, name: 'Старый проект', avatar: '📦', lastMsg: 'Финальный отчёт', time: '2 нед.', archived: true },
  { id: 8, name: 'Команда Бета', avatar: '🌀', lastMsg: 'Закрыто', time: '1 мес.', archived: true },
];

const SECRET_CHATS: Chat[] = [
  { id: 9, name: 'Засекреченный', avatar: '👁', lastMsg: '••••••••••', time: '08:01', secret: true, encrypted: true },
  { id: 10, name: 'Проект Тень', avatar: '🕵️', lastMsg: '••••••', time: 'вчера', secret: true, encrypted: true },
];

const CONTACTS = [
  { id: 1, name: 'Алиса Громова', status: 'В сети', avatar: 'АГ', online: true },
  { id: 2, name: 'Денис Волков', status: 'Был(а) 2ч назад', avatar: 'ДВ', online: false },
  { id: 3, name: 'Лена Морозова', status: 'В сети', avatar: 'ЛМ', online: true },
  { id: 4, name: 'Виктор Орлов', status: 'Был(а) вчера', avatar: 'ВО', online: false },
  { id: 5, name: 'Мария Ким', status: 'В сети', avatar: 'МК', online: true },
  { id: 6, name: 'Павел Зуев', status: 'Был(а) 5д назад', avatar: 'ПЗ', online: false },
];

const MESSAGES: Message[] = [
  { id: 1, text: 'Привет! Канал зашифрован по E2E протоколу.', time: '14:00', mine: false, encrypted: true },
  { id: 2, text: 'Отлично. Когда встречаемся?', time: '14:01', mine: true, status: 'read', encrypted: true },
  { id: 3, text: 'Завтра в 10, офис в центре. Пришлю координаты.', time: '14:05', mine: false, encrypted: true },
  { id: 4, text: 'Хорошо, буду там. Взять документы?', time: '14:10', mine: true, status: 'read', encrypted: true },
  { id: 5, text: 'Да, и не забудь подписанный договор. Это важно.', time: '14:18', mine: false, encrypted: true },
  { id: 6, text: 'Окей, встретимся завтра 🔐', time: '14:22', mine: false, encrypted: true },
];

const NAV_ITEMS = [
  { id: 'chats' as Section, icon: 'MessageSquare', label: 'Чаты' },
  { id: 'search' as Section, icon: 'Search', label: 'Поиск' },
  { id: 'contacts' as Section, icon: 'Users', label: 'Контакты' },
  { id: 'archive' as Section, icon: 'Archive', label: 'Архив' },
  { id: 'secret' as Section, icon: 'ShieldCheck', label: 'Закрытые' },
  { id: 'profile' as Section, icon: 'User', label: 'Профиль' },
  { id: 'settings' as Section, icon: 'Settings', label: 'Настройки' },
];

function AvatarBadge({ text, online, size = 'md' }: { text: string; online?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-xl' };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizeMap[size]} rounded-xl flex items-center justify-center font-display font-semibold bg-gradient-to-br from-dark-card to-dark-panel border border-dark-border text-neon-green`}>
        {text}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-bg ${online ? 'bg-neon-green online-ring' : 'bg-gray-600'}`} />
      )}
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

function ChatList({ chats, onSelect, selected }: { chats: Chat[]; onSelect: (c: Chat) => void; selected: Chat | null }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat, i) => (
        <button
          key={chat.id}
          onClick={() => onSelect(chat)}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-dark-card border-b border-dark-border/40 animate-fade-in ${selected?.id === chat.id ? 'bg-dark-card border-l-2 border-l-neon-green' : ''}`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <AvatarBadge text={chat.avatar} online={chat.online} />
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-white truncate">{chat.name}</span>
              <span className="text-[10px] text-gray-500 font-mono ml-2 flex-shrink-0">{chat.time}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-500 truncate">{chat.lastMsg}</span>
              <div className="flex items-center gap-1 ml-2">
                {chat.encrypted && <EncryptBadge />}
                {chat.unread && (
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
  );
}

function ChatWindow({ chat }: { chat: Chat | null }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(MESSAGES);

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

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: input,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
      status: 'sent',
      encrypted: true,
    }]);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-dark-border bg-dark-panel/60 backdrop-blur-sm">
        <AvatarBadge text={chat.avatar} online={chat.online} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{chat.name}</span>
            {chat.encrypted && (
              <span className="flex items-center gap-1 bg-neon-green/10 border border-neon-green/30 rounded-full px-2 py-0.5">
                <Icon name="ShieldCheck" size={10} className="text-neon-green" />
                <span className="text-[10px] font-mono text-neon-green">ЗАШИФРОВАНО</span>
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">{chat.online ? 'в сети' : 'не в сети'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg hover:bg-dark-card flex items-center justify-center transition-colors">
            <Icon name="Phone" size={16} className="text-gray-500" />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-dark-card flex items-center justify-center transition-colors">
            <Icon name="Video" size={16} className="text-gray-500" />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-dark-card flex items-center justify-center transition-colors">
            <Icon name="MoreVertical" size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {chat.encrypted && (
        <div className="mx-4 mt-3 mb-1 flex items-center justify-center gap-2 bg-neon-green/5 border border-neon-green/15 rounded-xl py-1.5">
          <Icon name="Lock" size={12} className="text-neon-green encrypt-spin" />
          <span className="text-[11px] font-mono text-neon-green/70">Сквозное шифрование активно — никто кроме вас не читает сообщения</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} msg-pop`}>
            <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${msg.mine
              ? 'bg-gradient-to-br from-neon-green/20 to-neon-green/8 border border-neon-green/25 rounded-tr-sm'
              : 'bg-dark-card border border-dark-border rounded-tl-sm'
            }`}>
              <p className="text-sm text-white leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {msg.encrypted && <Icon name="Lock" size={9} className="text-neon-green/40" />}
                <span className="text-[10px] font-mono text-gray-600">{msg.time}</span>
                {msg.mine && msg.status && (
                  <span className="status-appear">
                    {msg.status === 'read' ? (
                      <Icon name="CheckCheck" size={12} className="text-neon-green" />
                    ) : (
                      <Icon name="Check" size={12} className="text-gray-500" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="bg-dark-card border border-dark-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-500" />
          </div>
        </div>
      </div>

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
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-panel transition-colors flex-shrink-0">
            <Icon name="Smile" size={16} className="text-gray-500" />
          </button>
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

function SearchSection() {
  const [query, setQuery] = useState('');
  const allItems = [...CHATS, ...CONTACTS.map(c => ({ ...c, lastMsg: c.status, time: '', id: c.id + 100, encrypted: false, online: c.online }))];
  const filtered = query ? allItems.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : [];

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest mb-3">Поиск</p>
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl px-3 py-2.5 focus-within:border-neon-green/40 transition-colors">
          <Icon name="Search" size={16} className="text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Чаты, контакты, сообщения..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <Icon name="X" size={14} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {!query && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <Icon name="Search" size={28} className="text-gray-700" />
            <p className="text-sm text-gray-600">Начните вводить для поиска</p>
          </div>
        )}
        {query && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Icon name="SearchX" size={28} className="text-gray-700" />
            <p className="text-sm text-gray-600">Ничего не найдено</p>
          </div>
        )}
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-3 border-b border-dark-border/40 animate-fade-in cursor-pointer hover:bg-dark-card rounded-xl px-2 transition-colors">
            <AvatarBadge text={item.avatar} online={item.online} />
            <div>
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-gray-500">{item.lastMsg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsSection() {
  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border flex items-center justify-between">
        <p className="font-display text-lg text-white uppercase tracking-widest">Контакты</p>
        <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors">
          <Icon name="UserPlus" size={14} className="text-neon-green" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">В сети — {CONTACTS.filter(c => c.online).length}</p>
          {CONTACTS.filter(c => c.online).map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-dark-border/30 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <AvatarBadge text={c.avatar} online={c.online} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-neon-green/70">{c.status}</p>
              </div>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-card transition-colors">
                <Icon name="MessageSquare" size={14} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
        <div className="px-4 py-2">
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2 mt-2">Не в сети — {CONTACTS.filter(c => !c.online).length}</p>
          {CONTACTS.filter(c => !c.online).map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-dark-border/30 animate-fade-in" style={{ animationDelay: `${(i + 3) * 50}ms` }}>
              <AvatarBadge text={c.avatar} online={c.online} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/70">{c.name}</p>
                <p className="text-xs text-gray-600">{c.status}</p>
              </div>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-card transition-colors">
                <Icon name="MessageSquare" size={14} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-y-auto">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest">Профиль</p>
      </div>
      <div className="px-4 py-6 flex flex-col items-center gap-4 border-b border-dark-border">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border-2 border-neon-green/40 flex items-center justify-center text-2xl font-display font-bold text-neon-green animate-pulse-glow">
            ВИ
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-neon-green flex items-center justify-center">
            <Icon name="Camera" size={12} className="text-dark-bg" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Виктор Иванов</p>
          <p className="text-xs font-mono text-neon-green/70">@viktor_ivanov</p>
          <p className="text-sm text-gray-500 mt-1">Разработчик. Защищаю приватность.</p>
        </div>
        <div className="flex items-center gap-2 bg-neon-green/5 border border-neon-green/20 rounded-xl px-4 py-2">
          <Icon name="ShieldCheck" size={14} className="text-neon-green" />
          <span className="text-xs font-mono text-neon-green">Аккаунт верифицирован</span>
        </div>
      </div>
      <div className="px-4 py-4 flex flex-col gap-1">
        {[
          { icon: 'Phone' as const, label: 'Телефон', value: '+7 999 000-00-00' },
          { icon: 'Mail' as const, label: 'Email', value: 'viktor@example.com' },
          { icon: 'MapPin' as const, label: 'Город', value: 'Москва' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-3 border-b border-dark-border/40">
            <div className="w-8 h-8 rounded-lg bg-dark-card flex items-center justify-center">
              <Icon name={item.icon} size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-mono uppercase">{item.label}</p>
              <p className="text-sm text-white">{item.value}</p>
            </div>
            <button className="ml-auto">
              <Icon name="Pencil" size={14} className="text-gray-600 hover:text-neon-green transition-colors" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchiveSection() {
  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest">Архив</p>
        <p className="text-xs text-gray-600 mt-0.5">{ARCHIVED.length} диалогов в архиве</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ARCHIVED.map((chat, i) => (
          <div key={chat.id} className="flex items-center gap-3 px-4 py-3 border-b border-dark-border/40 hover:bg-dark-card transition-colors cursor-pointer animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <AvatarBadge text={chat.avatar} />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-white/60">{chat.name}</span>
                <span className="text-[10px] font-mono text-gray-600">{chat.time}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{chat.lastMsg}</p>
            </div>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-panel transition-colors">
              <Icon name="ArchiveRestore" size={14} className="text-gray-600 hover:text-neon-green transition-colors" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        {SECRET_CHATS.map((chat, i) => (
          <div key={chat.id} className="flex items-center gap-3 px-4 py-3 border-b border-dark-border/40 hover:bg-dark-card transition-colors cursor-pointer" style={{ animationDelay: `${i * 60}ms` }}>
            <AvatarBadge text={chat.avatar} />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">{chat.name}</span>
                <span className="text-[10px] font-mono text-gray-600">{chat.time}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-600 font-mono">{chat.lastMsg}</span>
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

function SettingsSection() {
  const [settings, setSettings] = useState({
    e2e: true, notifications: true, readReceipts: true, online: true, biometric: false, autoDelete: false,
  });
  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const groups: { title: string; icon: string; items: { key: string; label: string; desc: string }[] }[] = [
    {
      title: 'Безопасность',
      icon: 'Shield',
      items: [
        { key: 'e2e', label: 'Сквозное шифрование', desc: 'E2E для всех сообщений' },
        { key: 'biometric', label: 'Биометрия', desc: 'Вход по отпечатку / Face ID' },
        { key: 'autoDelete', label: 'Автоудаление', desc: 'Сообщения удаляются через 24ч' },
      ]
    },
    {
      title: 'Приватность',
      icon: 'EyeOff',
      items: [
        { key: 'readReceipts', label: 'Уведомления о прочтении', desc: 'Показывать статус прочтения' },
        { key: 'online', label: 'Статус онлайн', desc: 'Показывать когда вы в сети' },
      ]
    },
    {
      title: 'Уведомления',
      icon: 'Bell',
      items: [
        { key: 'notifications', label: 'Push-уведомления', desc: 'Уведомления о новых сообщениях' },
      ]
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-y-auto">
      <div className="px-4 pt-5 pb-3 border-b border-dark-border">
        <p className="font-display text-lg text-white uppercase tracking-widest">Настройки</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.title} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border/60">
              <Icon name={group.icon} size={14} className="text-neon-green" />
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{group.title}</span>
            </div>
            {group.items.map((item) => (
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
          {([
            { icon: 'HelpCircle', label: 'Помощь', color: 'text-gray-500' },
            { icon: 'LogOut', label: 'Выйти из аккаунта', color: 'text-destructive' },
          ] as { icon: string; label: string; color: string }[]).map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 border-b border-dark-border/30 last:border-b-0 hover:bg-dark-panel transition-colors">
              <Icon name={item.icon} size={16} className={item.color} />
              <span className={`text-sm ${item.color}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const showChatWindow = section === 'chats' || section === 'archive' || section === 'secret';

  return (
    <div className="h-screen w-screen flex bg-dark-bg grid-bg overflow-hidden noise-bg">
      <div className="scanline" />

      <nav className="w-16 flex flex-col items-center py-4 gap-1 border-r border-dark-border bg-dark-panel/80 backdrop-blur-sm z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-purple/20 border border-neon-green/30 flex items-center justify-center mb-3">
          <Icon name="Zap" size={18} className="text-neon-green" />
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setSection(item.id); if (item.id !== 'chats') setSelectedChat(null); }}
            title={item.label}
            className={`group w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
              section === item.id
                ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                : 'text-gray-600 hover:text-gray-300 hover:bg-dark-card'
            }`}
          >
            <Icon name={item.icon} size={18} />
            {section === item.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-green rounded-r-full" />
            )}
            <span className="absolute left-14 bg-dark-card border border-dark-border text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans">
              {item.label}
            </span>
          </button>
        ))}

        <div className="mt-auto">
          <button
            onClick={() => setSection('profile')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 border border-neon-green/30 flex items-center justify-center text-xs font-display font-bold text-neon-green hover:border-neon-green transition-colors"
          >
            ВИ
          </button>
        </div>
      </nav>

      <div className="w-72 flex flex-col border-r border-dark-border bg-dark-panel/50">
        {section === 'chats' && (
          <>
            <div className="px-4 pt-5 pb-3 border-b border-dark-border flex items-center justify-between">
              <p className="font-display text-lg text-white uppercase tracking-widest">Чаты</p>
              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-card transition-colors">
                  <Icon name="Filter" size={14} className="text-gray-500" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors">
                  <Icon name="Plus" size={14} className="text-neon-green" />
                </button>
              </div>
            </div>
            <div className="mx-3 my-2 flex items-center gap-1.5 bg-neon-green/5 border border-neon-green/15 rounded-lg px-3 py-1.5">
              <Icon name="Lock" size={11} className="text-neon-green encrypt-spin" />
              <span className="text-[10px] font-mono text-neon-green/60">Все чаты защищены E2E</span>
            </div>
            <ChatList chats={CHATS} onSelect={setSelectedChat} selected={selectedChat} />
          </>
        )}
        {section === 'search' && <SearchSection />}
        {section === 'contacts' && <ContactsSection />}
        {section === 'profile' && <ProfileSection />}
        {section === 'archive' && <ArchiveSection />}
        {section === 'secret' && <SecretSection />}
        {section === 'settings' && <SettingsSection />}
      </div>

      <div className="flex-1 flex flex-col bg-dark-bg relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-neon-green/3 blur-3xl" />
          <div className="absolute bottom-32 left-10 w-48 h-48 rounded-full bg-neon-purple/3 blur-3xl" />
        </div>

        {showChatWindow ? (
          <ChatWindow chat={selectedChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center">
              <Icon name="Zap" size={28} className="text-neon-green opacity-30" />
            </div>
            <p className="font-display text-3xl text-white/20 tracking-widest uppercase">CipherTalk</p>
            <p className="text-xs text-gray-700 font-mono">Защищённый мессенджер</p>
          </div>
        )}
      </div>
    </div>
  );
}
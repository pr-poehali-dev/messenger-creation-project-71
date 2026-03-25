const URLS = {
  auth:     'https://functions.poehali.dev/a34ad981-816c-49f6-8611-4a4f2b9cfb67',
  me:       'https://functions.poehali.dev/46aec92f-f8af-4c54-813c-d0d3c4c68b01',
  chats:    'https://functions.poehali.dev/c2fb1add-12cd-4b55-9f9b-abddd022d132',
  messages: 'https://functions.poehali.dev/5fcfdf8b-d79c-4caa-b359-297794ecbba4',
  contacts: 'https://functions.poehali.dev/fbc55487-2669-4e26-a40b-e543987b3a00',
};

function token() {
  return localStorage.getItem('ct_token') || '';
}

async function parse(res: Response) {
  const data = await res.json();
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function apiGetChats() {
  const res = await fetch(URLS.chats, {
    headers: { 'X-Auth-Token': token() },
  });
  return parse(res);
}

export async function apiCreateChat(username: string) {
  const res = await fetch(URLS.chats, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
    body: JSON.stringify({ username }),
  });
  return parse(res);
}

export async function apiGetMessages(chatId: number) {
  const res = await fetch(`${URLS.messages}?chat_id=${chatId}`, {
    headers: { 'X-Auth-Token': token() },
  });
  return parse(res);
}

export async function apiSendMessage(chatId: number, text: string) {
  const res = await fetch(URLS.messages, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return parse(res);
}

export async function apiGetContacts(q?: string) {
  const url = q ? `${URLS.contacts}?q=${encodeURIComponent(q)}` : URLS.contacts;
  const res = await fetch(url, {
    headers: { 'X-Auth-Token': token() },
  });
  return parse(res);
}

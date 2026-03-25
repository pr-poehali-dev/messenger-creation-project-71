"""
Список чатов и создание нового чата.
GET  / — список чатов текущего пользователя
POST / — создать чат с другим пользователем (body: {username})
"""
import json, os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, token):
    cur.execute(
        '''SELECT u.id, u.username, u.display_name FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()''',
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    me = get_user(cur, token)
    if not me:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

    my_id, my_username, my_display = me

    # GET — список чатов
    if method == 'GET':
        cur.execute(
            '''SELECT
                c.id,
                u.id as partner_id,
                u.username as partner_username,
                u.display_name as partner_name,
                (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_time,
                (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != %s) as unread
               FROM chats c
               JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
               JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s
               JOIN users u ON u.id = cm2.user_id
               ORDER BY last_time DESC NULLS LAST''',
            (my_id, my_id, my_id)
        )
        rows = cur.fetchall()
        conn.close()

        chats = []
        for r in rows:
            chats.append({
                'id': r[0],
                'partner_id': r[1],
                'partner_username': r[2],
                'partner_name': r[3],
                'last_msg': r[4] or '',
                'last_time': r[5].strftime('%H:%M') if r[5] else '',
                'unread': int(r[6]),
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chats': chats})}

    # POST — создать чат
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        partner_username = (body.get('username') or '').strip().lower()

        if not partner_username:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите username собеседника'})}

        cur.execute('SELECT id, display_name FROM users WHERE username = %s', (partner_username,))
        partner = cur.fetchone()
        if not partner:
            conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}

        partner_id, partner_name = partner

        if partner_id == my_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нельзя создать чат с собой'})}

        # Проверить — нет ли уже чата
        cur.execute(
            '''SELECT c.id FROM chats c
               JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
               JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s''',
            (my_id, partner_id)
        )
        existing = cur.fetchone()
        if existing:
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'chat_id': existing[0], 'partner_name': partner_name, 'already_exists': True
            })}

        cur.execute('INSERT INTO chats DEFAULT VALUES RETURNING id')
        chat_id = cur.fetchone()[0]
        cur.execute('INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)', (chat_id, my_id))
        cur.execute('INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)', (chat_id, partner_id))
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'chat_id': chat_id, 'partner_name': partner_name, 'partner_username': partner_username
        })}

    conn.close()
    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

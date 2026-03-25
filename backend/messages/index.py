"""
Сообщения чата.
GET  /?chat_id=X        — получить сообщения чата
POST /                  — отправить сообщение (body: {chat_id, text})
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

    my_id = me[0]

    # GET — список сообщений
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        chat_id = params.get('chat_id')
        if not chat_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите chat_id'})}

        # Проверить членство
        cur.execute('SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s', (chat_id, my_id))
        if not cur.fetchone():
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа к чату'})}

        cur.execute(
            '''SELECT m.id, m.sender_id, u.display_name, m.text,
                      to_char(m.created_at, 'HH24:MI') as time_str
               FROM messages m JOIN users u ON u.id = m.sender_id
               WHERE m.chat_id = %s
               ORDER BY m.created_at ASC
               LIMIT 100''',
            (chat_id,)
        )
        rows = cur.fetchall()
        conn.close()

        msgs = []
        for r in rows:
            msgs.append({
                'id': r[0],
                'sender_id': r[1],
                'sender_name': r[2],
                'text': r[3],
                'time': r[4],
                'mine': r[1] == my_id,
            })
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': msgs})}

    # POST — отправить сообщение
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        chat_id = body.get('chat_id')
        text = (body.get('text') or '').strip()

        if not chat_id or not text:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нужны chat_id и text'})}

        cur.execute('SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s', (chat_id, my_id))
        if not cur.fetchone():
            conn.close()
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа к чату'})}

        cur.execute(
            '''INSERT INTO messages (chat_id, sender_id, text)
               VALUES (%s, %s, %s)
               RETURNING id, to_char(created_at, 'HH24:MI')''',
            (chat_id, my_id, text)
        )
        msg_id, time_str = cur.fetchone()
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'id': msg_id, 'time': time_str, 'mine': True
        })}

    conn.close()
    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}

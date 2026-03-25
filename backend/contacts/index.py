"""
Список всех пользователей (кроме себя) для поиска собеседников.
GET /?q=... — поиск по username или display_name
"""
import json, os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        '''SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()''',
        (token,)
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}
    my_id = row[0]

    params = event.get('queryStringParameters') or {}
    q = (params.get('q') or '').strip().lower()

    if q:
        cur.execute(
            '''SELECT id, username, display_name FROM users
               WHERE id != %s AND (LOWER(username) LIKE %s OR LOWER(display_name) LIKE %s)
               ORDER BY display_name LIMIT 20''',
            (my_id, f'%{q}%', f'%{q}%')
        )
    else:
        cur.execute(
            'SELECT id, username, display_name FROM users WHERE id != %s ORDER BY display_name LIMIT 50',
            (my_id,)
        )

    rows = cur.fetchall()
    conn.close()

    users = [{'id': r[0], 'username': r[1], 'display_name': r[2]} for r in rows]
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

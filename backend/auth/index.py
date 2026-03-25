"""
Авторизация: регистрация, вход, получение профиля, выход.
POST /register — создать аккаунт
POST /login    — войти
GET  /me       — получить профиль по токену
POST /logout   — выйти
"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')

    # POST /register
    if path.endswith('/register') and method == 'POST':
        username = (body.get('username') or '').strip().lower()
        display_name = (body.get('display_name') or body.get('username') or '').strip()
        password = body.get('password') or ''

        if not username or not password:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'username и password обязательны'})}
        if len(username) < 3:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'username минимум 3 символа'})}
        if len(password) < 6:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'password минимум 6 символов'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь уже существует'})}

        pw_hash = hash_password(password)
        cur.execute(
            'INSERT INTO users (username, display_name, password_hash) VALUES (%s, %s, %s) RETURNING id',
            (username, display_name or username, pw_hash)
        )
        user_id = cur.fetchone()[0]

        session_token = secrets.token_hex(32)
        cur.execute(
            'INSERT INTO sessions (user_id, token) VALUES (%s, %s)',
            (user_id, session_token)
        )
        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({
                'token': session_token,
                'user': {'id': user_id, 'username': username, 'display_name': display_name or username}
            })
        }

    # POST /login
    if path.endswith('/login') and method == 'POST':
        username = (body.get('username') or '').strip().lower()
        password = body.get('password') or ''

        if not username or not password:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id, display_name, password_hash FROM users WHERE username = %s', (username,))
        row = cur.fetchone()

        if not row or row[2] != hash_password(password):
            conn.close()
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

        user_id, display_name, _ = row
        session_token = secrets.token_hex(32)
        cur.execute('INSERT INTO sessions (user_id, token) VALUES (%s, %s)', (user_id, session_token))
        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({
                'token': session_token,
                'user': {'id': user_id, 'username': username, 'display_name': display_name}
            })
        }

    # GET /me
    if path.endswith('/me') and method == 'GET':
        if not token:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            '''SELECT u.id, u.username, u.display_name 
               FROM sessions s JOIN users u ON u.id = s.user_id
               WHERE s.token = %s AND s.expires_at > NOW()''',
            (token,)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'user': {'id': row[0], 'username': row[1], 'display_name': row[2]}})
        }

    # POST /logout
    if path.endswith('/logout') and method == 'POST':
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute('UPDATE sessions SET expires_at = NOW() WHERE token = %s', (token,))
            conn.commit()
            conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

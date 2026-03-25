"""
Регистрация и вход. POST /?action=register или ?action=login
"""
import json, os, hashlib, secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}
    action = params.get('action') or body.get('action') or 'login'

    username = (body.get('username') or '').strip().lower()
    password = body.get('password') or ''

    if not username or not password:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    conn = get_conn()
    cur = conn.cursor()

    if action == 'register':
        display_name = (body.get('display_name') or username).strip()
        if len(username) < 3:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'username минимум 3 символа'})}
        if len(password) < 6:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь уже существует'})}

        cur.execute(
            'INSERT INTO users (username, display_name, password_hash) VALUES (%s, %s, %s) RETURNING id',
            (username, display_name, pw_hash)
        )
        user_id = cur.fetchone()[0]
        token = secrets.token_hex(32)
        cur.execute('INSERT INTO sessions (user_id, token) VALUES (%s, %s)', (user_id, token))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
            'token': token, 'user': {'id': user_id, 'username': username, 'display_name': display_name}
        })}

    # login
    cur.execute('SELECT id, display_name, password_hash FROM users WHERE username = %s', (username,))
    row = cur.fetchone()
    if not row or row[2] != pw_hash:
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

    user_id, display_name, _ = row
    token = secrets.token_hex(32)
    cur.execute('INSERT INTO sessions (user_id, token) VALUES (%s, %s)', (user_id, token))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
        'token': token, 'user': {'id': user_id, 'username': username, 'display_name': display_name}
    })}

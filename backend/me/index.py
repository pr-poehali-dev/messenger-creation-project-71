"""Получить профиль текущего пользователя по токену. GET /."""
import json, os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    if not token:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
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

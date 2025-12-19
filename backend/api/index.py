import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import secrets
from typing import Dict, Any

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для управления игроками Mini World Beans Bot
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Player-Id, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    player_id = headers.get('X-Player-Id') or headers.get('x-player-id')
    admin_token = headers.get('X-Admin-Token') or headers.get('x-admin-token')
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            endpoint = query_params.get('endpoint', '')
            
            if endpoint == 'leaderboard':
                cursor.execute('''
                    SELECT player_id, name, beans, 
                           ROW_NUMBER() OVER (ORDER BY beans DESC) as rank
                    FROM players
                    ORDER BY beans DESC
                    LIMIT 10
                ''')
                players = cursor.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(p) for p in players]),
                    'isBase64Encoded': False
                }
            
            elif endpoint == 'player' and player_id:
                cursor.execute('SELECT * FROM players WHERE player_id = %s', (player_id,))
                player = cursor.fetchone()
                
                if not player:
                    cursor.execute('''
                        INSERT INTO players (player_id, name, beans)
                        VALUES (%s, %s, 0)
                        RETURNING *
                    ''', (player_id, f'Игрок #{player_id[:6]}'))
                    conn.commit()
                    player = cursor.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(player), default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'admin_login':
                password = body_data.get('password')
                if password == 'Damoix1':
                    token = secrets.token_urlsafe(32)
                    expires_at = datetime.now() + timedelta(hours=24)
                    
                    cursor.execute('''
                        INSERT INTO admin_sessions (session_token, expires_at)
                        VALUES (%s, %s)
                    ''', (token, expires_at))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'token': token}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Неверный пароль'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'verify_admin':
                if not admin_token:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': False}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    SELECT * FROM admin_sessions 
                    WHERE session_token = %s AND expires_at > NOW()
                ''', (admin_token,))
                session = cursor.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'valid': session is not None}),
                    'isBase64Encoded': False
                }
            
            elif action == 'join_channel' and player_id:
                cursor.execute('''
                    UPDATE players 
                    SET channel_joined = TRUE, beans = beans + 50, 
                        total_earned = total_earned + 50,
                        updated_at = NOW()
                    WHERE player_id = %s AND channel_joined = FALSE
                    RETURNING beans
                ''', (player_id,))
                result = cursor.fetchone()
                conn.commit()
                
                if result:
                    cursor.execute('''
                        INSERT INTO transactions (player_id, type, amount, description)
                        VALUES (%s, %s, %s, %s)
                    ''', (player_id, 'earn', 50, 'Вступление в канал'))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'beans': result['beans']}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Награда уже получена'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'withdraw' and player_id:
                amount = body_data.get('amount', 0)
                account_id = body_data.get('account_id')
                
                cursor.execute('SELECT beans FROM players WHERE player_id = %s', (player_id,))
                player = cursor.fetchone()
                
                if not player or player['beans'] < amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Недостаточно бобов'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    UPDATE players 
                    SET beans = beans - %s, total_withdrawn = total_withdrawn + %s,
                        updated_at = NOW()
                    WHERE player_id = %s
                    RETURNING beans
                ''', (amount, amount, player_id))
                result = cursor.fetchone()
                conn.commit()
                
                cursor.execute('''
                    INSERT INTO transactions (player_id, type, amount, description)
                    VALUES (%s, %s, %s, %s)
                ''', (player_id, 'withdraw', -amount, f'Вывод на аккаунт {account_id}'))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'beans': result['beans']}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_question' and player_id:
                question = body_data.get('question', '')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Вопрос отправлен администратору'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_update_balance':
                cursor.execute('''
                    SELECT * FROM admin_sessions 
                    WHERE session_token = %s AND expires_at > NOW()
                ''', (admin_token,))
                session = cursor.fetchone()
                
                if not session:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                target_player_id = body_data.get('target_player_id')
                amount = body_data.get('amount', 0)
                
                cursor.execute('''
                    UPDATE players 
                    SET beans = beans + %s, updated_at = NOW()
                    WHERE player_id = %s
                    RETURNING beans
                ''', (amount, target_player_id))
                result = cursor.fetchone()
                conn.commit()
                
                if result:
                    cursor.execute('''
                        INSERT INTO transactions (player_id, type, amount, description)
                        VALUES (%s, %s, %s, %s)
                    ''', (target_player_id, 'admin', amount, f'Изменение администратором'))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'beans': result['beans']}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Игрок не найден'}),
                        'isBase64Encoded': False
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cursor.close()
        conn.close()
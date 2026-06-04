import json
import os
import psycopg2
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

SCHEMA = 't_p24058207_website_creation_pro'
MSK = timezone(timedelta(hours=3))


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Автоматически закрывает незакрытые смены промоутеров в 23:00 МСК"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    now_msk = datetime.now(MSK)
    today_msk = now_msk.date()

    # Закрываем смены, открытые сегодня и не закрытые
    close_time = datetime(today_msk.year, today_msk.month, today_msk.day, 23, 0, 0, tzinfo=MSK)

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"""
        UPDATE {SCHEMA}.work_shifts
        SET shift_end = %s, updated_at = NOW()
        WHERE shift_end IS NULL
          AND shift_date = %s
        RETURNING id, user_id, organization_id
    """, (close_time, today_msk))

    closed = cur.fetchall()
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'closed_count': len(closed),
            'closed_shifts': [{'id': r[0], 'user_id': r[1], 'organization_id': r[2]} for r in closed]
        })
    }

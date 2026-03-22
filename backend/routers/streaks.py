from fastapi import APIRouter, Depends
from datetime import date, timedelta
from db.database import get_db

router = APIRouter(prefix="/streaks", tags=["streaks"])

@router.post("/checkin")
async def checkin(db=Depends(get_db)):
    today = date.today().isoformat()
    await db.execute(
        "INSERT OR IGNORE INTO user_streaks (date, visited) VALUES (?, 1)", (today,)
    )
    await db.commit()
    return {"date": today, "checked_in": True}

@router.get("")
async def get_streaks(db=Depends(get_db)):
    async with db.execute(
        "SELECT date FROM user_streaks ORDER BY date DESC"
    ) as cur:
        rows = await cur.fetchall()
    dates = [r["date"] for r in rows]
    current_streak = _calc_streak(dates)
    longest_streak = _calc_longest(dates)
    return {"current_streak": current_streak, "longest_streak": longest_streak, "history": dates}

def _calc_streak(dates: list[str]) -> int:
    if not dates:
        return 0
    today = date.today()
    streak = 0
    check = today
    date_set = set(dates)
    while check.isoformat() in date_set:
        streak += 1
        check -= timedelta(days=1)
    return streak

def _calc_longest(dates: list[str]) -> int:
    if not dates:
        return 0
    sorted_dates = sorted(set(dates))
    longest = current = 1
    for i in range(1, len(sorted_dates)):
        a = date.fromisoformat(sorted_dates[i - 1])
        b = date.fromisoformat(sorted_dates[i])
        if (b - a).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest

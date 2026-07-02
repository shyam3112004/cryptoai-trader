from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from models import AIConsultation, AIKnowledge, AILearningSession

async def add_ai_knowledge(
    db: AsyncSession,
    user_id: str,
    video_id: str,
    title: str,
    channel: str,
    strategy_type: str,
    rules: str,
    confidence: float
) -> AIKnowledge:
    knowledge = AIKnowledge(
        user_id=user_id,
        video_id=video_id,
        title=title,
        channel=channel,
        strategy_type=strategy_type,
        rules=rules,
        confidence=confidence
    )
    db.add(knowledge)
    await db.flush()
    return knowledge

async def get_all_ai_knowledge(db: AsyncSession, user_id: str) -> list[AIKnowledge]:
    stmt = select(AIKnowledge).where(AIKnowledge.user_id == user_id).order_by(desc(AIKnowledge.date))
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def add_ai_consultation(
    db: AsyncSession,
    user_id: str,
    symbol: str,
    issue_type: str,
    prompt_summary: str,
    response_summary: str,
    recommendation: str,
    tokens_used: int = 0,
    estimated_cost: float = 0.0
) -> AIConsultation:
    consultation = AIConsultation(
        user_id=user_id,
        symbol=symbol,
        issue_type=issue_type,
        prompt_summary=prompt_summary,
        response_summary=response_summary,
        recommendation=recommendation,
        tokens_used=tokens_used,
        estimated_cost=estimated_cost
    )
    db.add(consultation)
    await db.flush()
    return consultation

async def get_ai_consultations(db: AsyncSession, user_id: str, limit: int = 50) -> list[AIConsultation]:
    stmt = select(AIConsultation).where(AIConsultation.user_id == user_id).order_by(desc(AIConsultation.date)).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def add_learning_session(
    db: AsyncSession,
    user_id: str,
    query: str,
    videos_scanned: int,
    strategies_extracted: int
) -> AILearningSession:
    session = AILearningSession(
        user_id=user_id,
        query=query,
        videos_scanned=videos_scanned,
        strategies_extracted=strategies_extracted
    )
    db.add(session)
    await db.flush()
    return session

async def get_ai_summary_stats(db: AsyncSession, user_id: str) -> dict:
    """
    Get aggregated usage metrics for the dashboard status indicators.
    """
    # 1. Total strategies learned
    stmt_knowledge = select(func.count(AIKnowledge.id)).where(AIKnowledge.user_id == user_id)
    k_count = await db.scalar(stmt_knowledge) or 0
    
    # 2. Total consultations
    stmt_consults = select(func.count(AIConsultation.id)).where(AIConsultation.user_id == user_id)
    c_count = await db.scalar(stmt_consults) or 0

    # 3. Today's Claude token cost
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    stmt_cost = select(func.sum(AIConsultation.estimated_cost)).where(
        AIConsultation.user_id == user_id,
        AIConsultation.date >= today_start
    )
    today_cost = await db.scalar(stmt_cost) or 0.0

    # 4. Last consultation recommendation
    stmt_last = select(AIConsultation).where(AIConsultation.user_id == user_id).order_by(desc(AIConsultation.date)).limit(1)
    last_res = await db.execute(stmt_last)
    last_consult = last_res.scalar_one_or_none()
    
    last_recommendation = "N/A"
    last_consult_time = None
    if last_consult:
        last_recommendation = last_consult.recommendation
        last_consult_time = last_consult.date.isoformat()

    return {
        "strategies_count": k_count,
        "consultations_count": c_count,
        "today_cost_usd": round(today_cost, 4),
        "last_recommendation": last_recommendation,
        "last_consult_time": last_consult_time
    }

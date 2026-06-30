from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import AnalyticsEvent, Company, Card, Profile, User
from ..utils.auth import get_jwt_user
from datetime import datetime, timedelta

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@bp.route('/company/<company_id>', methods=['GET'])
def get_company_analytics(company_id):
    """Get company-wide analytics"""
    from sqlalchemy import func, and_
    
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Use database queries for aggregations
    base_filter = and_(
        AnalyticsEvent.company_id == company_id,
        AnalyticsEvent.timestamp >= start_date
    )
    
    total_events = db.session.query(func.count(AnalyticsEvent.id)).filter(base_filter).scalar() or 0
    taps = db.session.query(func.count(AnalyticsEvent.id)).filter(
        and_(base_filter, AnalyticsEvent.event_type == 'tap')
    ).scalar() or 0
    profile_views = db.session.query(func.count(AnalyticsEvent.id)).filter(
        and_(base_filter, AnalyticsEvent.event_type == 'profile_view')
    ).scalar() or 0
    
    # Device breakdown
    device_breakdown = {}
    device_stats = db.session.query(
        AnalyticsEvent.device_type,
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(AnalyticsEvent.device_type).all()
    
    for device, count in device_stats:
        device_breakdown[device or 'unknown'] = count
    
    unique_devices = list(device_breakdown.keys())
    
    # Events by day
    events_by_day = {}
    day_stats = db.session.query(
        func.date(AnalyticsEvent.timestamp).label('day'),
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(func.date(AnalyticsEvent.timestamp)).all()
    
    for day, count in day_stats:
        events_by_day[day.isoformat() if hasattr(day, 'isoformat') else str(day)] = count
    
    # Top cards
    top_card_stats = db.session.query(
        AnalyticsEvent.card_id,
        func.count(AnalyticsEvent.id).label('hits')
    ).filter(base_filter).group_by(AnalyticsEvent.card_id).order_by(
        func.count(AnalyticsEvent.id).desc()
    ).limit(10).all()
    
    top_cards = []
    for card_id, hits in top_card_stats:
        card = Card.query.get(card_id) if card_id else None
        top_cards.append({
            'card_id': card_id,
            'hits': hits,
            'code': card.code if card else None,
            'card': card.to_dict() if card else None
        })
    
    return {
        'analytics': {
            'period_days': days,
            'total_events': total_events,
            'taps': taps,
            'profile_views': profile_views,
            'unique_devices': unique_devices,
            'device_breakdown': device_breakdown,
            'events_by_day': events_by_day,
            'top_cards': top_cards
        }
    }, 200


@bp.route('/user/<user_id>', methods=['GET'])
def get_user_analytics(user_id):
    """Get user profile analytics"""
    from sqlalchemy import func, and_
    
    current_user = get_jwt_user()
    
    if not current_user or (current_user.id != user_id and current_user.role != 'admin'):
        return {'error': 'Access denied'}, 403
    
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    base_filter = and_(
        AnalyticsEvent.user_id == user_id,
        AnalyticsEvent.timestamp >= start_date
    )
    
    # Use database queries for aggregations
    total_events = db.session.query(func.count(AnalyticsEvent.id)).filter(base_filter).scalar() or 0
    profile_views = db.session.query(func.count(AnalyticsEvent.id)).filter(
        and_(base_filter, AnalyticsEvent.event_type == 'profile_view')
    ).scalar() or 0
    taps = db.session.query(func.count(AnalyticsEvent.id)).filter(
        and_(base_filter, AnalyticsEvent.event_type == 'tap')
    ).scalar() or 0
    
    # Device breakdown
    device_breakdown = {}
    device_stats = db.session.query(
        AnalyticsEvent.device_type,
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(AnalyticsEvent.device_type).all()
    
    for device, count in device_stats:
        device_breakdown[device or 'unknown'] = count
    
    # Browser breakdown
    browser_breakdown = {}
    browser_stats = db.session.query(
        AnalyticsEvent.browser,
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(AnalyticsEvent.browser).all()
    
    for browser, count in browser_stats:
        browser_breakdown[browser or 'unknown'] = count
    
    # Views by day
    views_by_day = {}
    day_stats = db.session.query(
        func.date(AnalyticsEvent.timestamp).label('day'),
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(func.date(AnalyticsEvent.timestamp)).all()
    
    for day, count in day_stats:
        views_by_day[day.isoformat() if hasattr(day, 'isoformat') else str(day)] = count
    
    # Recent events (only query 10)
    recent_events_list = AnalyticsEvent.query.filter(base_filter).order_by(
        AnalyticsEvent.timestamp.desc()
    ).limit(10).all()
    
    return {
        'analytics': {
            'user_id': user_id,
            'period_days': days,
            'total_events': total_events,
            'profile_views': profile_views,
            'taps': taps,
            'device_breakdown': device_breakdown,
            'browser_breakdown': browser_breakdown,
            'views_by_day': views_by_day,
            'recent_events': [
                {
                    'event_type': event.event_type,
                    'device_type': event.device_type,
                    'browser': event.browser,
                    'referrer': event.referrer,
                    'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                }
                for event in recent_events_list
            ]
        }
    }, 200


@bp.route('/card/<card_id>', methods=['GET'])
def get_card_analytics(card_id):
    """Get card-specific analytics"""
    from sqlalchemy import func, and_
    
    user = get_jwt_user()
    
    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404
    
    if not user or (user.role != 'admin' and user.company_id != card.company_id):
        return {'error': 'Access denied'}, 403
    
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    base_filter = and_(
        AnalyticsEvent.card_id == card_id,
        AnalyticsEvent.timestamp >= start_date
    )
    
    # Use database queries for aggregations
    total_hits = db.session.query(func.count(AnalyticsEvent.id)).filter(base_filter).scalar() or 0
    
    # Device breakdown
    device_breakdown = {}
    device_stats = db.session.query(
        AnalyticsEvent.device_type,
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(AnalyticsEvent.device_type).all()
    
    for device, count in device_stats:
        device_breakdown[device or 'unknown'] = count
    
    # Referrers
    referrers = {}
    referrer_stats = db.session.query(
        AnalyticsEvent.referrer,
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(AnalyticsEvent.referrer).order_by(
        func.count(AnalyticsEvent.id).desc()
    ).limit(10).all()
    
    for referrer, count in referrer_stats:
        referrers[referrer or 'direct'] = count
    
    # Hits by day
    hits_by_day = {}
    day_stats = db.session.query(
        func.date(AnalyticsEvent.timestamp).label('day'),
        func.count(AnalyticsEvent.id)
    ).filter(base_filter).group_by(func.date(AnalyticsEvent.timestamp)).all()
    
    for day, count in day_stats:
        hits_by_day[day.isoformat() if hasattr(day, 'isoformat') else str(day)] = count
    
    return {
        'analytics': {
            'card_id': card_id,
            'period_days': days,
            'total_hits': total_hits,
            'device_breakdown': device_breakdown,
            'top_referrers': referrers,
            'hits_by_day': hits_by_day
        }
    }, 200

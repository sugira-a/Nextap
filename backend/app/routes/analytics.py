from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import AnalyticsEvent, Company, Card, Profile, User
from ..utils.auth import get_jwt_user
from datetime import datetime, timedelta

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@bp.route('/company/<company_id>', methods=['GET'])
def get_company_analytics(company_id):
    """Get company-wide analytics"""
    user = get_jwt_user()
    
    if not user or (user.role != 'admin' and user.company_id != company_id):
        return {'error': 'Access denied'}, 403
    
    company = Company.query.get(company_id)
    if not company:
        return {'error': 'Company not found'}, 404
    
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get events
    events = AnalyticsEvent.query.filter(
        AnalyticsEvent.company_id == company_id,
        AnalyticsEvent.timestamp >= start_date
    ).all()
    
    # Aggregate data
    taps = len([e for e in events if e.event_type == 'tap'])
    views = len([e for e in events if e.event_type == 'profile_view'])
    unique_devices = set([e.device_type for e in events if e.device_type])

    device_breakdown = {}
    for event in events:
        device = event.device_type or 'unknown'
        if device not in device_breakdown:
            device_breakdown[device] = 0
        device_breakdown[device] += 1
    
    # Event by day
    events_by_day = {}
    for event in events:
        day = event.timestamp.date().isoformat()
        if day not in events_by_day:
            events_by_day[day] = 0
        events_by_day[day] += 1
    
    # Top cards
    card_hits = {}
    for event in events:
        if event.card_id:
            if event.card_id not in card_hits:
                card_hits[event.card_id] = 0
            card_hits[event.card_id] += 1
    
    top_cards = sorted(card_hits.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        'analytics': {
            'period_days': days,
            'total_events': len(events),
            'taps': taps,
            'profile_views': views,
            'unique_devices': list(unique_devices),
            'device_breakdown': device_breakdown,
            'events_by_day': events_by_day,
            'top_cards': [
                {
                    'card_id': card_id,
                    'hits': hits,
                    'card': Card.query.get(card_id).to_dict() if card_id else None
                }
                for card_id, hits in top_cards
            ]
        }
    }, 200


@bp.route('/user/<user_id>', methods=['GET'])
def get_user_analytics(user_id):
    """Get user profile analytics"""
    current_user = get_jwt_user()
    
    if not current_user or (current_user.id != user_id and current_user.role != 'admin'):
        return {'error': 'Access denied'}, 403
    
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get events
    events = AnalyticsEvent.query.filter(
        AnalyticsEvent.user_id == user_id,
        AnalyticsEvent.timestamp >= start_date
    ).all()
    
    # Aggregate data
    views = len([e for e in events if e.event_type == 'profile_view'])
    taps = len([e for e in events if e.event_type == 'tap'])
    
    # Device breakdown
    device_breakdown = {}
    for event in events:
        device = event.device_type or 'unknown'
        if device not in device_breakdown:
            device_breakdown[device] = 0
        device_breakdown[device] += 1
    
    # Browser breakdown
    browser_breakdown = {}
    for event in events:
        browser = event.browser or 'unknown'
        if browser not in browser_breakdown:
            browser_breakdown[browser] = 0
        browser_breakdown[browser] += 1
    
    # Views by day
    views_by_day = {}
    for event in events:
        day = event.timestamp.date().isoformat()
        if day not in views_by_day:
            views_by_day[day] = 0
        views_by_day[day] += 1
    
    return {
        'analytics': {
            'user_id': user_id,
            'period_days': days,
            'total_events': len(events),
            'profile_views': views,
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
                for event in sorted(events, key=lambda item: item.timestamp, reverse=True)[:10]
            ]
        }
    }, 200


@bp.route('/card/<card_id>', methods=['GET'])
def get_card_analytics(card_id):
    """Get card-specific analytics"""
    user = get_jwt_user()
    
    card = Card.query.get(card_id)
    if not card:
        return {'error': 'Card not found'}, 404
    
    if not user or (user.role != 'admin' and user.company_id != card.company_id):
        return {'error': 'Access denied'}, 403
    
    # Time range
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get events
    events = AnalyticsEvent.query.filter(
        AnalyticsEvent.card_id == card_id,
        AnalyticsEvent.timestamp >= start_date
    ).all()
    
    # Aggregate data
    hits = len(events)
    
    # Device breakdown
    device_breakdown = {}
    for event in events:
        device = event.device_type or 'unknown'
        if device not in device_breakdown:
            device_breakdown[device] = 0
        device_breakdown[device] += 1
    
    # Location/referrer
    referrers = {}
    for event in events:
        referrer = event.referrer or 'direct'
        if referrer not in referrers:
            referrers[referrer] = 0
        referrers[referrer] += 1
    
    # Hits by day
    hits_by_day = {}
    for event in events:
        day = event.timestamp.date().isoformat()
        if day not in hits_by_day:
            hits_by_day[day] = 0
        hits_by_day[day] += 1
    
    return {
        'analytics': {
            'card_id': card_id,
            'period_days': days,
            'total_hits': hits,
            'device_breakdown': device_breakdown,
            'top_referrers': dict(sorted(referrers.items(), key=lambda x: x[1], reverse=True)[:10]),
            'hits_by_day': hits_by_day
        }
    }, 200

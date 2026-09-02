
import hashlib, json, random
from datetime import datetime, timezone
from . import db
from .models import Record, AuditEvent

def now(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def get(resource, rid): return Record.query.filter_by(resource=resource,id=rid).first()
def rows(resource): return Record.query.filter_by(resource=resource).all()
def payload(resource,rid):
    r=get(resource,rid); return r.payload.copy() if r else None

def put(resource, data, rid=None):
    rid=rid or data.get('id') or f"{resource.rstrip('s')}-{random.randrange(10**10,10**11)}"
    data=dict(data); data['id']=rid
    r=get(resource,rid)
    if r: r.payload=data
    else: db.session.add(Record(id=rid,resource=resource,payload=data))
    return data

def delete(resource,rid):
    r=get(resource,rid)
    if not r:return False
    db.session.delete(r); return True

def audit(actor, action, entity_type, entity_id, old=None, new=None, description=None, ip=None):
    db.session.add(AuditEvent(actor=actor,action=action,entity_type=entity_type,entity_id=entity_id,old_value=old,new_value=new,description=description,ip_address=ip))

def canonical_hash(value): return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def rank_results(exam_id):
    rs=[r.payload for r in rows('results') if r.payload.get('examination_id')==exam_id]
    rs.sort(key=lambda x:(-float(x.get('raw_marks',0)), -float(x.get('percentage',0)), x.get('student_id','')))
    prev=None; rank=0
    for i,r in enumerate(rs,1):
        score=(r.get('raw_marks'),r.get('maximum_marks'))
        if score!=prev: rank=i; prev=score
        r['position']=rank; put('results',r,r['id'])
    return rs

def grade_for(pct):
    """Resolve a percentage against the configured grade scale.

    Grade boundaries are inclusive, so the configured Edo State Ministry of Education scale maps:
    A=70-100, B=60-69.99, C=50-59.99, D=45-49.99,
    E=40-44.99 and F=0-39.99.
    """
    try:
        pct = float(pct)
    except (TypeError, ValueError):
        return 'F'

    if pct < 0:
        pct = 0.0
    elif pct > 100:
        pct = 100.0

    scales = []
    for r in rows('grade-scales'):
        g = r.payload
        try:
            lo = float(g.get('min_percent', 0))
            hi = float(g.get('max_percent', 100))
        except (TypeError, ValueError):
            continue
        if lo <= hi:
            scales.append((lo, hi, str(g.get('grade', 'F')).strip().upper()))

    for lo, hi, grade in sorted(scales, key=lambda item: item[0], reverse=True):
        if lo <= pct <= hi:
            return grade or 'F'

    return 'F'

def deterministic_theory(question, response, expected, max_marks):
    words=[w.lower() for w in __import__('re').split(r'[^a-z0-9]+', expected or '') if len(w)>3]
    low=(response or '').lower(); matched=list(dict.fromkeys([w for w in words if w in low]))
    ratio=min(1,len(matched)/max(1,int(len(words)*.6)))
    score=max(0,min(max_marks,round(ratio*max_marks)))
    return dict(proposedScore=score,confidence=.88,evidence=("Identified keywords: "+', '.join(matched[:5])) if matched else 'Candidate provided partial conceptual explanation.',missingConcepts=[] if len(matched)>=3 else ['Full derivations or specific terminology'],reasoning=f'Rule-based evaluation awarded {score}/{max_marks} marks; examiner approval remains mandatory.',evaluatedBy='EARPMS Deterministic Evaluator')

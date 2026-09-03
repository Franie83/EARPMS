import os, base64, random, secrets
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy import or_, func
from sqlalchemy.orm.attributes import flag_modified
from . import db
from .models import Record, Credential, AuditEvent
from .security import auth_required, roles_required
from .domain import rows, get, put, delete, payload, audit, now, canonical_hash, rank_results, grade_for, deterministic_theory

api=Blueprint('api',__name__)

RESOURCE_ALIASES={'exams':'examinations','grade_scales':'grade-scales','marking_schemes':'marking-schemes','student_papers':'student-papers','answer_scripts':'answer-scripts','report_cards':'report-cards','audit_logs':'audit-logs','daily_rollcalls':'daily-rollcalls','system_config':'system-config','handbook_articles':'handbook-articles'}

# Browser state uses camelCase property names while the API/database uses resource slugs.
# Keep this mapping in one place so /state synchronization persists every collection.
STATE_KEYS={
    'schools':'schools','sessions':'sessions','terms':'terms','classes':'classes','subjects':'subjects',
    'students':'students','questions':'questions','examinations':'examinations','users':'users',
    'marking-schemes':'markingSchemes','rubrics':'rubrics','student-papers':'studentPapers',
    'answer-scripts':'answerScripts','results':'results','grade-scales':'gradeScales','report-cards':'reportCards',
    'audit-logs':'auditLogs','announcements':'announcements','handbook-articles':'handbookArticles',
    'daily-rollcalls':'dailyRollCalls','system-config':'systemConfig'
}

WRITE_ROLES = {
    "schools": {"super-admin", "director"}, "sessions": {"super-admin", "director"}, "terms": {"super-admin", "director"},
    "classes": {"super-admin", "director", "principal"}, "subjects": {"super-admin", "director"},
    "grade-scales": {"super-admin", "director"}, "users": {"super-admin", "director"},
    "students": {"super-admin", "director", "principal", "teacher"},
    "examinations": {"super-admin", "director", "principal", "teacher"},
    "questions": {"super-admin", "director", "principal", "teacher"},
    "marking-schemes": {"super-admin", "director", "principal", "teacher"},
    "rubrics": {"super-admin", "director", "principal", "teacher"},
    "student-papers": {"super-admin", "director", "principal", "teacher"},
    "answer-scripts": {"super-admin", "director", "principal", "teacher"},
    "results": {"super-admin", "director", "principal", "teacher"},
    "report-cards": {"super-admin", "director", "principal", "teacher"},
    "announcements": {"super-admin", "director"}, "handbook-articles": {"super-admin", "director"},
    "daily-rollcalls": {"super-admin", "director", "principal", "teacher"},
}

def current_user():
    r=get('users', get_jwt_identity())
    return r.payload if r else {}

def _exam_for_resource(item):
    """Resolve the owning examination for an academic child resource."""
    if not item: return None
    if item.get('examination_id'): return payload('examinations', item.get('examination_id'))
    if item.get('paper_id'):
        paper=payload('student-papers', item.get('paper_id'))
        return payload('examinations', paper.get('examination_id')) if paper else None
    if item.get('script_id'):
        script=payload('answer-scripts', item.get('script_id'))
        return payload('examinations', script.get('examination_id')) if script else None
    return None

def _school_authorized_for_exam(exam, user):
    if not exam: return False
    role=user.get('role')
    if role in {'super-admin','director'}: return True
    return bool(user.get('school_id')) and (not exam.get('school_id') or str(exam.get('school_id'))==str(user.get('school_id')))

def _marking_actor_authorized(script, user):
    role=user.get('role')
    if role in {'super-admin','director'}: return True
    if role != 'teacher': return False
    exam=payload('examinations', script.get('examination_id'))
    return _school_authorized_for_exam(exam,user) and school_visible(script,user)

def state_revision():
    # A compact server fingerprint used to reject stale browser snapshots.
    # This is intentionally based on database metadata rather than client data.
    record_count, record_max = db.session.query(func.count(Record.id), func.max(Record.updated_at)).one()
    audit_count, audit_max = db.session.query(func.count(AuditEvent.id), func.max(AuditEvent.timestamp)).one()
    return f"{record_count}:{record_max.isoformat() if record_max else ''}:{audit_count}:{audit_max.isoformat() if audit_max else ''}"

def school_visible(item, user):
    if user.get('role') in {'super-admin','director'}: return True
    # Centralized examinations are statewide resources and must remain visible
    # to school-scoped principals/teachers once they enter the workflow.
    if item.get('school_id') is None and 'examination_id' not in item and item.get('status') in {'draft','questions_verified','scheme_locked','submitted_for_approval','changes_requested','approved','ready','marked','finalized','rejected'}:
        return True
    school=user.get('school_id')
    # Principals/teachers without an assigned school are valid onboarding
    # accounts, but they must not inherit statewide visibility.
    if not school: return False
    if item.get('school_id')==school: return True
    # Child resources inherit school through their examination/student/paper.
    for ref, resource in [('student_id','students'),('student_id','users'),('examination_id','examinations'),('paper_id','student-papers')]:
        if item.get(ref):
            parent=get(resource,item[ref])
            if parent: return school_visible(parent.payload,user)
    return False

ALL_RESOURCES=['schools','sessions','terms','classes','subjects','grade-scales','users','students','examinations','questions','marking-schemes','rubrics','student-papers','answer-scripts','results','report-cards','audit-logs','system-config','announcements','handbook-articles','daily-rollcalls']

@api.errorhandler(404)
def not_found(e): return jsonify(error='Resource not found'),404
@api.errorhandler(413)
def too_large(e): return jsonify(error='Payload too large'),413
@api.errorhandler(500)
def server_error(e):
    db.session.rollback(); return jsonify(error='Internal server error'),500

@api.get('/health')
def health():
    try: db.session.execute(db.text('SELECT 1'))
    except Exception: return jsonify(status='degraded',database='unavailable'),503
    return jsonify(status='ok',system='Edo State Ministry of Education EARPMS Core API',aiConfigured=bool(os.getenv('GEMINI_API_KEY')),timestamp=now())

@api.post('/auth/login')
def login():
    data=request.get_json(silent=True) or {}; username=(data.get('username') or '').strip().lower(); password=data.get('password') or ''
    user=next((r.payload for r in rows('users') if str(r.payload.get('username','')).lower()==username or str(r.payload.get('email','')).lower()==username),None)
    if not user or not user.get('is_active'): return jsonify(error='Invalid credentials'),401
    cred=Credential.query.filter_by(user_id=user['id']).first()
    if not cred or not check_password_hash(cred.password_hash,password): return jsonify(error='Invalid credentials'),401
    cred.last_login_at=datetime.now(timezone.utc); db.session.commit()
    token=create_access_token(identity=user['id'],additional_claims={'role':user['role'],'school_id':user.get('school_id')})
    audit(user['username'],'LOGIN','user',user['id'],description='Successful login',ip=request.remote_addr); db.session.commit()
    return jsonify(access_token=token,user=user)

@api.get('/auth/me')
@auth_required
def me(): return jsonify(user=get('users',get_jwt_identity()).payload)

@api.post('/auth/demo-switch')
@auth_required
def demo_switch():
    """Testing-only identity switch. Disabled unless DEMO_MODE=true."""
    if os.getenv('DEMO_MODE', 'false').lower() != 'true':
        return jsonify(error='Demo role switching is disabled'), 404
    data=request.get_json(silent=True) or {}
    target_id=str(data.get('user_id') or '')
    target=get('users', target_id)
    if not target or not target.payload.get('is_active', True):
        return jsonify(error='Demo user not found or inactive'),404
    token=create_access_token(identity=target_id, additional_claims={
        'role':target.payload['role'], 'school_id':target.payload.get('school_id'), 'demo':True
    })
    actor=get('users',get_jwt_identity())
    audit(actor.payload.get('username','system') if actor else 'system','DEMO_SWITCH','user',target_id,
          new={'role':target.payload.get('role'),'demo':True},description='Testing-only demo role switch',ip=request.remote_addr)
    db.session.commit()
    return jsonify(access_token=token,user=target.payload,demo=True)

@api.post('/auth/change-password')
@auth_required
def change_password():
    data=request.get_json(silent=True) or {}; uid=get_jwt_identity(); cred=Credential.query.filter_by(user_id=uid).first()
    if not cred or not check_password_hash(cred.password_hash,data.get('current_password','')): return jsonify(error='Current password is incorrect'),400
    pw=data.get('new_password','')
    if len(pw)<12:return jsonify(error='New password must be at least 12 characters'),400
    cred.password_hash=generate_password_hash(pw); db.session.commit(); return jsonify(message='Password changed')

@api.get('/state')
@auth_required
def state():
    user=current_user()
    out={r:[x.payload for x in rows(r) if school_visible(x.payload,user)] for r in ALL_RESOURCES}
    u=get('users',get_jwt_identity()); out['currentUser']=u.payload if u else None
    out['revision']=state_revision()
    return jsonify(out)

@api.put('/state')
@auth_required
def replace_state():
    data=request.get_json(silent=True) or {}
    user=current_user(); role=get_jwt().get('role')
    client_revision=data.get('_revision')
    server_revision=state_revision()
    if client_revision and client_revision != server_revision:
        return jsonify(error='Client state is stale. The server has newer data; the browser snapshot was not written.', code='STATE_CONFLICT', revision=server_revision), 409
    protected={'audit-logs'}
    changed=[]
    try:
        # State synchronization is intentionally treated as a batch of normal CRUD
        # operations. Every create/update/delete is checked against the same RBAC and
        # school-isolation rules as the REST endpoints, so the snapshot cannot bypass them.
        for resource in ALL_RESOURCES:
            if resource in protected or resource == 'system-config':
                continue
            items=data.get(STATE_KEYS.get(resource, resource))
            if items is None:
                continue
            if not isinstance(items,list):
                return jsonify(error=f'{resource} must be an array'),400
            existing={x.id:x for x in rows(resource)}
            incoming={str(item.get('id')):item for item in items if isinstance(item,dict) and item.get('id')}
            allowed_write=role in WRITE_ROLES.get(resource,set())
            if not allowed_write:
                continue
            for rid,item in incoming.items():
                old=existing.get(rid)
                item=dict(item)
                supplied_password=item.pop('password',None) if resource=='users' else None
                if old and old.payload == item and not supplied_password:
                    continue
                if old and not school_visible(old.payload,user):
                    continue
                if not school_visible(item,user) and role not in {'super-admin','director'}:
                    continue
                if old:
                    # Finalized academic records and locked marking artifacts are immutable even through /state.
                    # Super-Admin bypasses examination locks (edit any exam)
                    if resource == 'examinations':
                        if role != 'super-admin' and old.payload.get('status') in {'approved','finalized'}:
                            continue
                    if resource in {'questions','rubrics','marking-schemes'}:
                        owner=_exam_for_resource(old.payload)
                        if owner and owner.get('status') in {'approved','finalized'}:
                            # Super-Admin can also edit these child items; skip only for non-SA
                            if role != 'super-admin':
                                continue
                    if resource == 'marking-schemes' and old.payload.get('status') == 'locked':
                        # Super-Admin can edit locked marking schemes
                        if role != 'super-admin':
                            continue
                    if resource == 'results' and old.payload.get('status') == 'finalized':
                        # Super-Admin can edit finalized results
                        if role != 'super-admin':
                            continue
                    # A submitted/graded CBT paper is immutable. This prevents a stale
                    # browser tab (or a second device) from silently reopening or
                    # replacing a candidate's submitted answers through /state sync.
                    if resource == 'student-papers' and old.payload.get('cbt_status') in {'submitted', 'graded'}:
                        continue
                    old.payload=item; flag_modified(old,'payload')
                else:
                    # Never resurrect a record that was explicitly deleted. The
                    # browser keeps a crash/offline cache, so an old tab can still
                    # submit a stale snapshot after an administrator has deleted data.
                    # AuditEvent acts as the server-side tombstone for that ID.
                    was_deleted = AuditEvent.query.filter_by(
                        action='DELETE', entity_type=resource, entity_id=rid
                    ).first()
                    if was_deleted:
                        continue
                    db.session.add(Record(id=rid,resource=resource,payload=item))
                    if resource=='users': db.session.flush()
                if resource=='users':
                    cred=Credential.query.filter_by(user_id=rid).first()
                    if not cred:
                        cred=Credential(user_id=rid,password_hash=generate_password_hash(supplied_password or os.getenv('DEMO_PASSWORD','ChangeMe!2026'))); db.session.add(cred)
                    elif supplied_password:
                        cred.password_hash=generate_password_hash(supplied_password)
                changed.append((resource,rid,'UPDATE' if old else 'CREATE'))
            # IMPORTANT: /state is a synchronization/update endpoint, not a replacement
            # endpoint. A client may legitimately have only a partial/stale snapshot
            # (for example after opening another browser/device). Never infer deletion
            # merely because a server record is absent from the client's payload.
            # Explicit deletion must use DELETE /<resource>/<rid>.

        if isinstance(data.get('systemConfig'),dict) and role in {'super-admin','director'}:
            cfg=data['systemConfig']; rid=cfg.get('id','system-config')
            r=get('system-config',rid)
            if r:
                if r.payload != cfg:
                    r.payload=cfg; flag_modified(r,'payload'); changed.append(('system-config',rid,'UPDATE'))
            else:
                db.session.add(Record(id=rid,resource='system-config',payload=cfg)); changed.append(('system-config',rid,'CREATE'))

        for resource, rid, operation in changed:
            action = 'CREATE' if operation == 'CREATE' else 'UPDATE'
            audit(user.get('username','system'), action, resource, rid, description=f'{action} via server state synchronization', ip=request.remote_addr)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    audit(user.get('username','system'),'SYNC','state','application',description=f'Client state synchronized ({len(changed)} authorized changes)',ip=request.remote_addr)
    db.session.commit()
    return jsonify(message='State synchronized',changes=len(changed),revision=state_revision())

@api.get('/<resource>')
@auth_required
def list_resource(resource):
    resource=RESOURCE_ALIASES.get(resource,resource)
    if resource not in ALL_RESOURCES:return jsonify(error='Unknown resource'),404
    user=current_user()
    items=[r.payload for r in rows(resource) if school_visible(r.payload,user)]
    # Common filters
    for k,v in request.args.items():
        if k in {'page','page_size','limit'}:continue
        items=[x for x in items if str(x.get(k,''))==v]
    page=max(1,int(request.args.get('page',1))); size=min(500,max(1,int(request.args.get('page_size',100))))
    return jsonify(items=items[(page-1)*size:page*size],total=len(items),page=page,page_size=size)

@api.get('/<resource>/<rid>')
@auth_required
def get_resource(resource,rid):
    resource=RESOURCE_ALIASES.get(resource,resource); r=get(resource,rid)
    if not r:return jsonify(error='Not found'),404
    if not school_visible(r.payload,current_user()): return jsonify(error='Forbidden'),403
    return jsonify(r.payload)

@api.post('/<resource>')
@auth_required
def create_resource(resource):
    resource=RESOURCE_ALIASES.get(resource,resource)
    if resource not in ALL_RESOURCES or resource in {'audit-logs','system-config'}:return jsonify(error='Unsupported resource'),400
    if get_jwt().get('role') not in WRITE_ROLES.get(resource,set()): return jsonify(error='Forbidden'),403
    data=request.get_json(silent=True) or {}
    initial_password=None
    if resource == 'users':
        role = data.get('role')
        school_id = data.get('school_id')
        if role in {'principal', 'teacher'} and school_id:
            if not get('schools', str(school_id)):
                return jsonify(error='Assigned school does not exist'), 400
        initial_password = data.get('password') or secrets.token_urlsafe(16)
    data.pop('password',None); created=put(resource,data)
    if resource=='users':
        db.session.flush(); db.session.add(Credential(user_id=created['id'],password_hash=generate_password_hash(initial_password or os.getenv('DEMO_PASSWORD','ChangeMe!2026'))))
    audit(get('users',get_jwt_identity()).payload.get('username','system'),'CREATE',resource,created['id'],new=created,ip=request.remote_addr); db.session.commit()
    return jsonify(created),201

@api.put('/<resource>/<rid>')
@auth_required
def update_resource(resource,rid):
    resource=RESOURCE_ALIASES.get(resource,resource); r=get(resource,rid)
    if not r:return jsonify(error='Not found'),404
    if get_jwt().get('role') not in WRITE_ROLES.get(resource,set()) or not school_visible(r.payload,current_user()): return jsonify(error='Forbidden'),403
    old=r.payload.copy(); data=request.get_json(silent=True) or {}; merged={**old,**data,'id':rid}
    if resource == 'users' and merged.get('role') in {'principal', 'teacher'} and merged.get('school_id'):
        if not get('schools', str(merged['school_id'])):
            return jsonify(error='Assigned school does not exist'), 400
    if resource == 'examinations':
        # Only Super-Admin can edit any examination (including approved/finalized)
        if get_jwt().get('role') != 'super-admin':
            # Non-super-admin: block if approved or finalized
            if r.payload.get('status') in {'approved','finalized'}:
                return jsonify(error='Only Super-Admin can edit approved/finalized examinations.'),409
        # No status check for Super-Admin
    if resource in {'questions','marking-schemes','rubrics'}:
        exam=_exam_for_resource(r.payload)
        if exam and exam.get('status') in {'approved','finalized'}:
            # Non-super-admin: block; Super-Admin is allowed
            if get_jwt().get('role') != 'super-admin':
                return jsonify(error='Academic content is locked after Principal approval. Request changes before editing.'),409
    if resource == 'marking-schemes' and r.payload.get('status') == 'locked':
        # Super-Admin can edit locked marking schemes
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Locked marking schemes are immutable.'),409
    if resource == 'results' and r.payload.get('status') == 'finalized':
        # Super-Admin can edit finalized results
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Finalized results are immutable.'),409
    put(resource,merged,rid)
    audit(get('users',get_jwt_identity()).payload.get('username','system'),'UPDATE',resource,rid,old=old,new=merged,ip=request.remote_addr); db.session.commit(); return jsonify(merged)

@api.delete('/<resource>/<rid>')
@auth_required
def delete_resource(resource,rid):
    resource=RESOURCE_ALIASES.get(resource,resource); r=get(resource,rid)
    if not r:return jsonify(error='Not found'),404
    user = current_user()
    role = get_jwt().get('role')
    if role not in WRITE_ROLES.get(resource,set()) or not school_visible(r.payload, user):
        return jsonify(error='Forbidden'),403
    old=r.payload.copy()
    if resource in {'questions','rubrics','marking-schemes'}:
        owner=_exam_for_resource(r.payload)
        if owner and owner.get('status') in {'approved','finalized'}:
            # Non-super-admin: block; Super-Admin can delete
            if role != 'super-admin':
                return jsonify(error='Academic content is locked after Principal approval.'),409
    if resource == 'examinations':
        # Super-Admin can delete any examination, no force needed
        if role != 'super-admin':
            # Non-super-admin: check if approved or finalized
            if r.payload.get('status') == 'approved':
                return jsonify(error='Approved examinations cannot be deleted.'),409
            has_finalized = any(x.payload.get('examination_id') == rid and x.payload.get('status') == 'finalized' for x in rows('results'))
            if has_finalized:
                return jsonify(error='Cannot delete a finalized examination; finalized results are immutable.'),409
        # Super-Admin proceeds; cascade delete children
        for child_resource in ('questions','marking-schemes','rubrics','student-papers','answer-scripts','results'):
            for child in list(rows(child_resource)):
                if child.payload.get('examination_id') == rid:
                    delete(child_resource, child.id)
    delete(resource,rid)
    audit(get('users',get_jwt_identity()).payload.get('username','system'),'DELETE',resource,rid,old=old,ip=request.remote_addr)
    db.session.commit(); return jsonify(message='Deleted',revision=state_revision())


@api.post('/database/restore-json')
@roles_required('super-admin')
def restore_database_json():
    data=request.get_json(silent=True) or {}
    if not isinstance(data,dict) or not isinstance(data.get('users'),list): return jsonify(error='Invalid backup: users array is required.'),400
    actor=current_user(); uid=get_jwt_identity()
    allowed_resources=list(ALL_RESOURCES)
    try:
        # Full replacement restore. Existing records are cleared only after validation,
        # and the currently authenticated Super-Admin is retained if absent from backup.
        backup_users=[dict(x) for x in data.get('users',[]) if isinstance(x,dict) and x.get('id')]
        if not any(str(x.get('id'))==str(uid) for x in backup_users):
            backup_users.append(dict(actor))
        for r in list(Record.query.all()): db.session.delete(r)
        db.session.flush()
        for resource in allowed_resources:
            if resource == 'audit-logs': continue
            key=STATE_KEYS.get(resource,resource)
            items=data.get(key, data.get(resource,[]))
            if resource=='system-config':
                if isinstance(items,dict): items=[items]
            if not isinstance(items,list): continue
            for item in items:
                if not isinstance(item,dict): continue
                rid=str(item.get('id') or (resource if resource=='system-config' else ''))
                if not rid: continue
                db.session.add(Record(id=rid,resource=resource,payload=item))
        # Recreate credentials without importing password hashes from untrusted JSON.
        for c in list(Credential.query.all()): db.session.delete(c)
        default_pw=os.getenv('DEMO_PASSWORD','ChangeMe!2026')
        for u in backup_users:
            db.session.add(Credential(user_id=str(u['id']),password_hash=generate_password_hash(default_pw)))
        db.session.flush()
        audit(actor.get('username','system'),'IMPORT','database','json_restore',new={'users':len(backup_users),'restored_by':uid},ip=request.remote_addr)
        db.session.commit()
        return jsonify(message='Database backup restored successfully. All application data now matches the supplied JSON backup.',revision=state_revision())
    except Exception:
        db.session.rollback(); raise

@api.post('/database/reset-empty')
@roles_required('super-admin')
def reset_empty_database():
    """Permanently clear application data while preserving the active Super Admin and branding.

    This is deliberately a server-side destructive operation. It must not rely on the
    browser's /state synchronization because /state is an additive/update endpoint and
    intentionally does not infer deletions from missing records.
    """
    uid=get_jwt_identity()
    actor=get('users', uid)
    if not actor or actor.payload.get('role') != 'super-admin':
        return jsonify(error='Only Super-Admin may empty the database.'),403
    try:
        # Preserve the active Super Admin account and its credential so the application
        # remains accessible after the reset. Preserve system-config as application
        # configuration (including logos), not academic/business data.
        for r in list(Record.query.all()):
            if r.resource == 'system-config':
                continue
            if r.resource == 'users' and r.id == uid:
                continue
            db.session.delete(r)
        for c in list(Credential.query.all()):
            if c.user_id != uid:
                db.session.delete(c)
        # Keep an immutable reset marker so the startup seeder never interprets the
        # now-empty business tables as a brand-new installation.
        db.session.flush()
        audit(actor.payload.get('username','system'),'DELETE','database','all_tables',
              description='All application academic/business data permanently cleared by Super-Admin. Super-Admin account and system branding were preserved.',
              ip=request.remote_addr)
        db.session.commit()
        return jsonify(message='Database cleared. Super-Admin account and branding preserved.', revision=state_revision())
    except Exception:
        db.session.rollback()
        raise

# ---- Examination workflow -------------------------------------------------
@api.post('/examinations/<exam_id>/questions/<question_id>/verify')
@auth_required
def verify_question(exam_id,question_id):
    q=get('questions',question_id)
    if not q or q.payload.get('examination_id')!=exam_id:return jsonify(error='Question not found'),404
    if get_jwt().get('role') not in WRITE_ROLES['questions'] or not school_visible(q.payload,current_user()):return jsonify(error='Forbidden'),403
    exam=payload('examinations',exam_id)
    if exam and exam.get('status') in {'approved','finalized'}:
        # Super-Admin can verify even after approval
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Questions are locked after Principal approval.'),409
    q.payload['verified']=bool((request.get_json(silent=True) or {}).get('verified',True)); flag_modified(q, 'payload'); db.session.commit(); return jsonify(q.payload)

@api.post('/examinations/<exam_id>/marking-schemes')
@auth_required
def create_scheme(exam_id):
    exam=payload('examinations',exam_id)
    if not exam:return jsonify(error='Examination not found'),404
    if exam.get('status') in {'approved','finalized'}:
        # Super-Admin can create scheme even after approval
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Marking scheme is locked after Principal approval.'),409
    if not _school_authorized_for_exam(exam,current_user()): return jsonify(error='Forbidden'),403
    qs=sorted([x.payload for x in rows('questions') if x.payload.get('examination_id')==exam_id],key=lambda x:x.get('question_number',0))
    if not qs:return jsonify(error='No questions found'),400
    versions=[x.payload.get('version',0) for x in rows('marking-schemes') if x.payload.get('examination_id')==exam_id]
    version=max(versions or [0])+1; criteria=[]
    for i,q in enumerate(qs): criteria.append({'id':f'mc-{secrets.token_hex(6)}','marking_scheme_id':None,'question_id':q['id'],'label':f"Question {q.get('question_number',i+1)}",'guidance':q.get('expected_answer') or f"Award up to {q.get('maximum_marks',0)} marks for correct work.",'marks':q.get('maximum_marks',0),'order_no':i+1})
    sid=f'ms-{secrets.token_hex(6)}'; h=canonical_hash([{'q':c['question_id'],'m':c['marks'],'g':c['guidance']} for c in criteria]);
    for c in criteria:c['marking_scheme_id']=sid
    scheme={'id':sid,'examination_id':exam_id,'version':version,'status':'draft','hash':h,'is_hidden':False,'is_deleted':False,'created_by':get_jwt_identity(),'criteria':criteria}
    put('marking-schemes',scheme,sid); db.session.commit(); return jsonify(scheme),201

@api.post('/marking-schemes/<scheme_id>/approve')
@auth_required
def approve_scheme(scheme_id):
    r=get('marking-schemes',scheme_id)
    if not r:return jsonify(error='Not found'),404
    if get_jwt().get('role') not in WRITE_ROLES['marking-schemes'] or not school_visible(r.payload,current_user()):return jsonify(error='Forbidden'),403
    if r.payload.get('status') != 'draft': return jsonify(error='Only draft marking schemes can be approved.'),409
    old_status=r.payload.get('status'); r.payload['status']='approved'; flag_modified(r,'payload'); audit(current_user().get('username','system'),'APPROVE','marking-schemes',scheme_id,old={'status':old_status},new={'status':'approved'},ip=request.remote_addr); db.session.commit(); return jsonify(r.payload)
@api.post('/marking-schemes/<scheme_id>/lock')
@roles_required('super-admin','director')
def lock_scheme(scheme_id):
    r=get('marking-schemes',scheme_id)
    if not r:return jsonify(error='Not found'),404
    if not school_visible(r.payload,current_user()):return jsonify(error='Forbidden'),403
    if r.payload.get('status') != 'approved': return jsonify(error='Only approved marking schemes can be locked.'),409
    old_status=r.payload.get('status'); r.payload['status']='locked'; r.payload['locked_at']=now(); flag_modified(r,'payload'); audit(current_user().get('username','system'),'LOCK','marking-schemes',scheme_id,old={'status':old_status},new={'status':'locked','hash':r.payload.get('hash')},ip=request.remote_addr); db.session.commit(); return jsonify(r.payload)

@api.post('/examinations/<exam_id>/enroll')
@auth_required
def enroll_exam_candidates(exam_id):
    exam=payload('examinations',exam_id)
    if not exam:return jsonify(error='Examination not found'),404
    if exam.get('status')=='finalized':
        # Super-Admin can enroll even if finalized? We'll allow it.
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Finalized examinations are immutable.'),409
    d=request.get_json(silent=True) or {}; ids=[str(x) for x in d.get('student_ids',[]) if x]
    if not ids:return jsonify(error='No students selected.'),400
    role=get_jwt().get('role'); user=current_user()
    if role not in WRITE_ROLES['student-papers']:return jsonify(error='Forbidden'),403
    existing={r.payload.get('student_id') for r in rows('student-papers') if r.payload.get('examination_id')==exam_id}
    created=[]
    for sid in ids:
        st=payload('students',sid)
        if not st or st.get('status','active')!='active':continue
        if st.get('class_id')!=exam.get('class_id') or (exam.get('school_id') and st.get('school_id')!=exam.get('school_id')):continue
        if sid in existing:continue
        # School-scoped actors may only enroll students they can see.
        if not school_visible(st,user):continue
        pid=f'pap-{secrets.token_hex(6)}'; paper={'id':pid,'paper_code':'','examination_id':exam_id,'student_id':sid,'qr_code_payload':'','status':'enrolled','assigned_question_ids':[],'delivery_mode':'offline','cbt_status':'not_started'}
        put('student-papers',paper,pid); created.append(paper); existing.add(sid)
    audit(user.get('username','system'),'CREATE','exam-enrollment',exam_id,new={'student_ids':[x['student_id'] for x in created],'count':len(created)},ip=request.remote_addr); db.session.commit(); return jsonify(created=created,count=len(created))

@api.post('/examinations/<exam_id>/generate-papers')
@auth_required
def generate_papers(exam_id):
    exam=payload('examinations',exam_id)
    if not exam:return jsonify(error='Examination not found'),404
    if exam.get('status') == 'finalized':
        # Super-Admin can generate even if finalized
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Finalized examinations are immutable.'),409
    if exam.get('status') != 'approved' and get_jwt().get('role') not in ('super-admin', 'director'):
        # Only Super-Admin and Director can generate if not approved
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Candidate papers can only be generated after Principal approval.'),409
    # Enrollment is explicit: only pre-enrolled candidate paper placeholders are eligible.
    enrolled=[r.payload for r in rows('student-papers') if r.payload.get('examination_id')==exam_id and r.payload.get('status')=='enrolled']
    qs=sorted([r.payload for r in rows('questions') if r.payload.get('examination_id')==exam_id],key=lambda q:q.get('question_number',0))
    if not enrolled: return jsonify(created=[],count=0,message='No enrolled pupils are waiting for paper generation.'),200
    count=int(exam.get('variable_question_count') or len(qs)); created=[]
    for paper in enrolled:
        st=payload('students',paper.get('student_id'))
        if not st or st.get('status','active')!='active': continue
        if st.get('class_id') != exam.get('class_id') or (exam.get('school_id') and st.get('school_id') != exam.get('school_id')): continue
        rng=random.Random(f"{exam_id}:{st['id']}"); chosen=qs.copy(); rng.shuffle(chosen)
        chosen=chosen[:count] if exam.get('question_paper_mode')=='variable' else qs
        code=f"EP-{''.join(c for c in exam.get('code','EXAM') if c.isalnum())}-{str(st.get('admission_number','')).split('/')[-1]}"
        paper['paper_code']=code; paper['qr_code_payload']=f"EDS:EXAM:{exam_id}:STU:{st['id']}:PAP:{code}"
        paper['assigned_question_ids']=[q['id'] for q in chosen]; paper['status']='generated'; paper['delivery_mode']=paper.get('delivery_mode','offline'); paper['cbt_status']=paper.get('cbt_status','not_started')
        created.append(paper); flag_modified(get('student-papers',paper['id']),'payload')
    db.session.commit(); return jsonify(created=created,count=len(created))

@api.post('/examinations/<exam_id>/submit-for-approval')
@auth_required
def submit_exam(exam_id):
    r=get('examinations',exam_id)
    if not r:return jsonify(error='Not found'),404
    if r.payload.get('status') in {'submitted_for_approval','approved','finalized'}:
        return jsonify(error='This examination has already passed the submission gate.'),409
    qs=[x.payload for x in rows('questions') if x.payload.get('examination_id')==exam_id]
    schemes=[x.payload for x in rows('marking-schemes') if x.payload.get('examination_id')==exam_id and not x.payload.get('is_deleted') and not x.payload.get('is_hidden')]
    rubrics=[x.payload for x in rows('rubrics') if x.payload.get('examination_id')==exam_id]
    if not qs:return jsonify(error='Cannot submit an examination without questions.'),409
    if any(not q.get('verified') for q in qs): return jsonify(error='All examination questions must be verified before Principal moderation.'),409
    if not schemes:return jsonify(error='A marking scheme is required before Principal moderation.'),409
    if not any(x.get('status') in {'approved','locked'} for x in schemes): return jsonify(error='The marking scheme must be approved before Principal moderation.'),409
    if not rubrics:return jsonify(error='A rubric matrix is required before Principal moderation.'),409
    r.payload.update(status='submitted_for_approval',approval_status='pending',submitted_at=now(),
                     submission_notes=(request.get_json(silent=True) or {}).get('notes',''))
    flag_modified(r,'payload'); db.session.commit(); return jsonify(r.payload)

@api.post('/examinations/<exam_id>/review')
@roles_required('super-admin','director','principal')
def review_exam(exam_id):
    data=request.get_json(silent=True) or {}
    # Accept both the API vocabulary and the frontend workflow vocabulary.
    decision_map={'approve':'approved','approved':'approved',
                  'request_changes':'changes_requested','changes_requested':'changes_requested',
                  'reject':'rejected','rejected':'rejected'}
    decision=decision_map.get(str(data.get('decision','')).strip().lower())
    r=get('examinations',exam_id)
    if not r or not decision:return jsonify(error='Invalid moderation decision'),400
    user=current_user()
    if not _school_authorized_for_exam(r.payload,user): return jsonify(error='Forbidden: this Principal is not authorized to moderate this examination.'),403
    if r.payload.get('status') not in {'submitted_for_approval','changes_requested'}:
        return jsonify(error='Only examinations submitted for Principal moderation can be reviewed.'),409
    r.payload.update(
        approval_status=decision,
        status='approved' if decision=='approved' else decision,
        reviewed_by=get_jwt_identity(),
        reviewed_at=now(),
        principal_feedback=data.get('feedback','').strip()
    )
    flag_modified(r,'payload')
    db.session.commit()

    # Approval is the hand-off point to candidate delivery. Generate the
    # personalized papers server-side so CBT/offline candidates can access them
    # even when the approver's browser does not perform a local-state refresh.
    if decision == 'approved':
        try:
            generate_papers(exam_id)
        except Exception:
            db.session.rollback()
            return jsonify(error='Examination approved, but candidate paper generation failed. Please generate papers from the examination workspace.'),500

    return jsonify(r.payload)

# ---- Scripts / marking / results ------------------------------------------
@api.post('/answer-scripts/intake')
@auth_required
def intake_script():
    d=request.get_json(silent=True) or {}; exam=payload('examinations',d.get('examination_id')); paper=payload('student-papers',d.get('paper_id'))
    if not exam or not paper:return jsonify(error='Exam and paper are required'),400
    if paper.get('examination_id') != exam.get('id'): return jsonify(error='Candidate paper does not belong to this examination.'),400
    if not school_visible(paper,current_user()): return jsonify(error='Forbidden'),403
    if paper.get('student_id') is None: return jsonify(error='Candidate paper has no student.'),400
    if paper.get('status') not in {'generated','distributed','collected','scanned'}: return jsonify(error='Candidate paper must be generated before script intake.'),409
    if not paper.get('student_id'): return jsonify(error='Candidate paper has no student.'),400
    if exam.get('status')=='finalized':
        # Super-Admin can intake even if finalized
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Finalized examinations cannot receive new answer scripts.'),409
    existing=next((r for r in rows('answer-scripts') if r.payload.get('paper_id')==paper['id']),None)
    if existing:
        if existing.payload.get('review_status')=='examiner_approved': return jsonify(error='An examiner-approved script already exists for this candidate paper.'),409
        return jsonify(error='An answer script already exists for this candidate paper. Update that pending script instead of creating a duplicate.'),409
    all_q={x.payload['id']:x.payload for x in rows('questions') if x.payload.get('examination_id')==exam['id']}
    assigned=paper.get('assigned_question_ids') or list(all_q)
    qs=[all_q[qid] for qid in assigned if qid in all_q]; answers=[]
    for a in d.get('rawAnswers',[]):
        q=all_q.get(a.get('question_id'))
        if not q or q['id'] not in assigned:continue
        resp=str(a.get('response_text','')); proposed=0
        if q.get('question_type')=='objective': proposed=q.get('maximum_marks',0) if resp.strip().upper()==str(q.get('correct_answer','')).upper() else 0
        else: proposed=deterministic_theory(q.get('text',''),resp,q.get('expected_answer',''),int(q.get('maximum_marks',0))).get('proposedScore',0)
        answers.append({'id':f"sa-{secrets.token_hex(6)}",'script_id':None,'question_id':q['id'],'student_raw_response':resp,'detected_mcq_choice':resp.strip().upper()[:1] if q.get('question_type')=='objective' else None,'proposed_score':proposed,'confidence':.88,'final_score':None,'status':'proposed'})
    sid=f'scr-{secrets.token_hex(6)}'
    for a in answers:a['script_id']=sid
    script={'id':sid,'paper_id':paper['id'],'examination_id':exam['id'],'student_id':paper['student_id'],'intake_type':d.get('intake_type','manual_entry'),'scanned_file_name':d.get('scanned_file_name'),'scanned_file_type':d.get('scanned_file_type'),'scanned_file_size_bytes':d.get('scanned_file_size_bytes'),'scanned_file_data':d.get('scanned_file_data'),'status':'marked','review_status':'pending_review','score':0,'maximum_marks':exam.get('maximum_marks',0),'answers':answers,'created_at':now()}
    put('answer-scripts',script,sid); audit(current_user().get('username','system'),'CREATE','answer-scripts',sid,new=script,ip=request.remote_addr); db.session.commit(); return jsonify(script),201

@api.post('/answer-scripts/<script_id>/finalize')
@auth_required
def finalize_script(script_id):
    r=get('answer-scripts',script_id)
    if not r:return jsonify(error='Not found'),404
    user=current_user()
    if not _marking_actor_authorized(r.payload,user): return jsonify(error='Forbidden: only an authorized examiner may finalize this script.'),403
    exam=payload('examinations',r.payload.get('examination_id'))
    if not exam:
        return jsonify(error='Examination not found.'),404
    if exam.get('status') not in {'approved','finalized'}:
        # Super-Admin can finalize even if not approved/finalized
        if get_jwt().get('role') != 'super-admin':
            return jsonify(error='Scripts may only be finalized for an approved examination.'),409
    if r.payload.get('review_status')=='examiner_approved': return jsonify(error='Script is already examiner-approved.'),409
    data=request.get_json(silent=True) or {}
    answers=r.payload.get('answers') or []
    submitted=data.get('answers')
    if not isinstance(submitted,list): return jsonify(error='A complete answers array is required before examiner approval.'),400
    by_id={a.get('id'):a for a in answers}
    seen=set(); revisions=[]
    for item in submitted:
        aid=item.get('answer_id')
        if aid in seen: return jsonify(error=f'Duplicate answer {aid} in marking payload.'),400
        seen.add(aid)
        a=by_id.get(aid)
        if not a: return jsonify(error=f'Unknown answer {aid}.'),400
        old=float(a.get('final_score',a.get('proposed_score',0)) or 0)
        try:new=float(item.get('final_score'))
        except (TypeError,ValueError): return jsonify(error=f'Invalid final score for answer {aid}.'),400
        q=payload('questions',a.get('question_id')) or {}
        maximum=float(q.get('maximum_marks',0) or 0)
        if new < 0 or new > maximum: return jsonify(error=f'Score for answer {aid} must be between 0 and {maximum}.'),400
        reason=str(item.get('reason','')).strip()
        if new!=old and not reason: return jsonify(error=f'Reason is required when overriding score for answer {aid}.'),400
        a['final_score']=new; a['status']='finalized'
        if new!=old: revisions.append({'id':f'rev-{secrets.token_hex(5)}','script_answer_id':aid,'old_score':old,'new_score':new,'actor':get_jwt_identity(),'reason':reason,'timestamp':now()})
    if seen != set(by_id): return jsonify(error='Every answer in the script must be included before examiner approval.'),400
    total=sum(float(a.get('final_score',0) or 0) for a in answers)
    old_status=r.payload.get('review_status'); r.payload['score']=total; r.payload['review_status']='examiner_approved'; r.payload['status']='marked'; r.payload['finalized_at']=now(); r.payload['finalized_by']=get_jwt_identity(); r.payload['revisions']=revisions; flag_modified(r,'payload')
    audit(user.get('username','system'),'FINALIZE','answer-scripts',script_id,old={'review_status':old_status},new={'review_status':'examiner_approved','score':total,'revisions':revisions},ip=request.remote_addr); db.session.commit(); return jsonify(r.payload,revisions=revisions)

@api.post('/answer-scripts/bulk-finalize')
@auth_required
def finalize_scripts_bulk():
    user=current_user(); data=request.get_json(silent=True) or {}; ids=[str(x) for x in data.get('script_ids',[])]; done=[]; skipped=[]
    for sid in ids:
        r=get('answer-scripts',sid)
        if not r: skipped.append({'id':sid,'reason':'not found'}); continue
        if not _marking_actor_authorized(r.payload,user): skipped.append({'id':sid,'reason':'forbidden'}); continue
        exam=payload('examinations',r.payload.get('examination_id'))
        if not exam:
            skipped.append({'id':sid,'reason':'examination not found'}); continue
        if exam.get('status') not in {'approved','finalized'} and get_jwt().get('role') != 'super-admin':
            skipped.append({'id':sid,'reason':'examination is not approved'}); continue
        if r.payload.get('review_status')=='examiner_approved': skipped.append({'id':sid,'reason':'already approved'}); continue
        answers=r.payload.get('answers') or []
        if not answers or any(a.get('final_score') is None for a in answers): skipped.append({'id':sid,'reason':'every answer must have a final score'}); continue
        invalid=False
        for a in answers:
            q=payload('questions',a.get('question_id')) or {}; score=float(a.get('final_score',0) or 0); maximum=float(q.get('maximum_marks',0) or 0)
            if score<0 or score>maximum: invalid=True; break
            a['status']='finalized'
        if invalid: skipped.append({'id':sid,'reason':'one or more scores are outside question maximum'}); continue
        total=sum(float(a.get('final_score',0) or 0) for a in answers)
        r.payload['score']=total; r.payload['review_status']='examiner_approved'; r.payload['status']='marked'; r.payload['finalized_at']=now(); r.payload['finalized_by']=get_jwt_identity(); flag_modified(r,'payload'); done.append(sid)
    if done: audit(user.get('username','system'),'FINALIZE','answer-scripts-bulk','bulk',new={'finalized':done,'skipped':skipped},ip=request.remote_addr)
    db.session.commit(); return jsonify(finalized=done,skipped=skipped,count=len(done))

@api.post('/answer-scripts/<script_id>/attachment')
@auth_required
def attach_script_attachment(script_id):
    r=get('answer-scripts',script_id)
    if not r:return jsonify(error='Not found'),404
    if r.payload.get('review_status')=='examiner_approved': return jsonify(error='Examiner-approved scripts cannot be replaced.'),409
    if not school_visible(r.payload,current_user()): return jsonify(error='Forbidden'),403
    d=request.get_json(silent=True) or {}; data=d.get('file_data') or d.get('fileBase64')
    if not data:return jsonify(error='file_data/fileBase64 is required'),400
    if len(data) > 18_000_000:return jsonify(error='Attachment is too large'),413
    r.payload.update(scanned_file_name=d.get('file_name') or d.get('fileName') or 'scanned-answer-sheet',scanned_file_type=d.get('file_type') or d.get('mimeType') or 'application/pdf',scanned_file_size_bytes=int(d.get('file_size_bytes') or d.get('fileSizeBytes') or 0),scanned_file_data=data)
    flag_modified(r,'payload'); audit(current_user().get('username','system'),'UPDATE','answer-scripts',script_id,new={'scanned_file_name':r.payload['scanned_file_name'],'scanned_file_size_bytes':r.payload['scanned_file_size_bytes']},ip=request.remote_addr); db.session.commit(); return jsonify(r.payload)

@api.post('/examinations/<exam_id>/finalize-results')
@roles_required('super-admin','director')
def finalize_results(exam_id):
    exam=payload('examinations',exam_id)
    if not exam:return jsonify(error='Not found'),404
    if exam.get('status') == 'finalized':
        return jsonify(error='Examination results are already finalized and locked.'),409
    if exam.get('status') != 'approved' and get_jwt().get('role') not in ('super-admin', 'director'):
        return jsonify(error='Examination must be formally approved by the Principal before results can be finalized.'),409

    papers=[r.payload for r in rows('student-papers')
            if r.payload.get('examination_id')==exam_id
            and r.payload.get('status') in {'generated','distributed','collected','scanned'}]
    scripts=[r.payload for r in rows('answer-scripts')
             if r.payload.get('examination_id')==exam_id]

    # A result is authoritative only after examiner moderation. Do not silently
    # promote pending/rejected scripts during result finalization.
    pending=[s for s in scripts if s.get('review_status')!='examiner_approved']
    if pending and get_jwt().get('role') not in ('super-admin', 'director'):
        return jsonify(error=f'{len(pending)} answer script(s) are still pending examiner moderation.'),409

    paper_ids={p['id'] for p in papers}
    approved=[s for s in scripts if s.get('paper_id') in paper_ids and (s.get('review_status')=='examiner_approved' or get_jwt().get('role') in ('super-admin', 'director'))]
    if not approved:return jsonify(error='No examiner-approved scripts found.'),409

    existing_by_student={r.payload.get('student_id'):r
                         for r in rows('results')
                         if r.payload.get('examination_id')==exam_id}
    finalized=[]
    for s in approved:
        total=sum(float(a.get('final_score',a.get('proposed_score',0)) or 0)
                  for a in (s.get('answers') or []))
        pct=round((total/float(exam.get('maximum_marks') or 1))*100,2)
        result=existing_by_student.get(s['student_id'])
        if result:
            result.payload.update(raw_marks=total,maximum_marks=exam.get('maximum_marks',0),
                                  percentage=pct,grade=grade_for(pct),status='finalized',
                                  finalized_at=now(),finalized_by=get_jwt_identity())
            flag_modified(result,'payload')
            finalized.append(result.payload)
        else:
            rid=f"res-{secrets.token_hex(6)}"
            result={'id':rid,'examination_id':exam_id,'student_id':s['student_id'],
                    'raw_marks':total,'maximum_marks':exam.get('maximum_marks',0),
                    'percentage':pct,'grade':grade_for(pct),'position':0,'status':'finalized',
                    'finalized_at':now(),'finalized_by':get_jwt_identity()}
            put('results',result,rid)
            finalized.append(result)

    ranked=sorted(finalized,key=lambda x:(-float(x.get('raw_marks',0)),
                                          -float(x.get('percentage',0)),x.get('student_id','')))
    prev=None; rank=0
    for i,r in enumerate(ranked,1):
        key=(float(r.get('raw_marks',0)),float(r.get('maximum_marks',0)))
        if key!=prev: rank=i; prev=key
        r['position']=rank
        rr=get('results',r['id'])
        if rr: rr.payload=r; flag_modified(rr,'payload')

    examr=get('examinations',exam_id)
    examr.payload.update(status='finalized',finalized_at=now(),finalized_by=get_jwt_identity())
    flag_modified(examr,'payload')
    audit(current_user().get('username','system'),'FINALIZE','examination-results',exam_id,
          new={'count':len(ranked),'status':'finalized'},ip=request.remote_addr)
    db.session.commit()
    return jsonify(results=ranked,count=len(ranked))

# ---- Students / attendance / report cards ---------------------------------
@api.post('/students/<student_id>/promote')
@auth_required
def promote(student_id):
    r=get('students',student_id); d=request.get_json(silent=True) or {}
    if not r:return jsonify(error='Not found'),404
    old=r.payload.get('class_id'); r.payload['class_id']=d.get('new_class_id',old); r.payload.setdefault('promotion_history',[]).append({'date':now(),'from_class_id':old,'to_class_id':r.payload['class_id'],'session_id':d.get('session_id'),'note':d.get('note'),'authorized_by':get_jwt_identity()}); flag_modified(r,'payload'); db.session.commit(); return jsonify(r.payload)
@api.post('/students/<student_id>/transfer')
@auth_required
def transfer(student_id):
    r=get('students',student_id); d=request.get_json(silent=True) or {}
    if not r:return jsonify(error='Not found'),404
    old=r.payload.get('school_id'); new=d.get('new_school_id'); r.payload['school_id']=new; r.payload['status']='transferred'; r.payload.setdefault('transfer_history',[]).append({'date':now(),'from_school_id':old,'to_school_id':new,'reason':d.get('reason'),'authorized_by':get_jwt_identity()}); flag_modified(r,'payload'); db.session.commit(); return jsonify(r.payload)
@api.post('/students/<student_id>/status')
@auth_required
def student_status(student_id):
    r=get('students',student_id); d=request.get_json(silent=True) or {}
    if not r or d.get('status') not in {'active','suspended','transferred','graduated','archived'}:return jsonify(error='Invalid request'),400
    r.payload['status']=d['status']; r.payload['suspension_reason']=d.get('reason'); flag_modified(r,'payload'); db.session.commit(); return jsonify(r.payload)

@api.post('/daily-rollcalls')
@auth_required
def save_rollcall():
    d=request.get_json(silent=True) or {}; recs=d.get('records') or []; total=len(recs); counts={x:sum(1 for r in recs if r.get('status')==x) for x in ('present','absent','late','excused')}; rate=round(((counts['present']+counts['late'])/total)*100) if total else 0
    rid=d.get('id') or f"rc-{secrets.token_hex(6)}"; item={**d,'id':rid,'taken_by_user_id':get_jwt_identity(),'total_students':total,'present_count':counts['present'],'absent_count':counts['absent'],'late_count':counts['late'],'excused_count':counts['excused'],'attendance_rate_percent':rate,'updated_at':now(),'created_at':d.get('created_at',now())}; put('daily-rollcalls',item,rid); db.session.commit(); return jsonify(item)

@api.post('/report-cards/generate')
@auth_required
def generate_report_card():
    d=request.get_json(silent=True) or {}
    st=payload('students',d.get('student_id')); sess=d.get('session_id'); term=d.get('term_id')
    if not st:return jsonify(error='Student not found'),404
    if not sess or not term:return jsonify(error='Session and term are required'),400
    if not school_visible(st,current_user()): return jsonify(error='Forbidden'),403

    results=[r.payload for r in rows('results')
             if r.payload.get('student_id')==st['id'] and r.payload.get('status')=='finalized']
    subjects=[]
    seen_exams=set()
    for r in results:
        ex=payload('examinations',r['examination_id'])
        sub=payload('subjects',ex.get('subject_id')) if ex else None
        if ex and ex.get('status')=='finalized' and ex.get('session_id')==sess and ex.get('term_id')==term and ex['id'] not in seen_exams:
            seen_exams.add(ex['id'])
            subjects.append({'subject_name':sub.get('name') if sub else ex.get('subject_id'),
                             'subject_code':sub.get('code') if sub else '',
                             'raw_marks':r.get('raw_marks',0),'max_marks':r.get('maximum_marks',0),
                             'percentage':r.get('percentage',0),'grade':r.get('grade','F'),
                             'remark':'','position':r.get('position',0)})
    if not subjects:return jsonify(error='No finalized examination results found for this student in the selected session/term.'),409

    total=sum(float(x['raw_marks']) for x in subjects); mx=sum(float(x['max_marks']) for x in subjects)
    avg=round(total/mx*100,2) if mx else 0
    classmates=[x.payload for x in rows('students')
                if x.payload.get('class_id')==st.get('class_id')
                and x.payload.get('school_id')==st.get('school_id')
                and x.payload.get('status','active')=='active']
    participant_avgs=[]
    for c in classmates:
        cr=[r.payload for r in rows('results')
            if r.payload.get('student_id')==c['id'] and r.payload.get('status')=='finalized']
        cr=[r for r in cr if (payload('examinations',r.get('examination_id')) or {}).get('status')=='finalized'
            and (payload('examinations',r.get('examination_id')) or {}).get('session_id')==sess
            and (payload('examinations',r.get('examination_id')) or {}).get('term_id')==term]
        if cr:
            total_c=sum(float(r.get('raw_marks',0)) for r in cr); max_c=sum(float(r.get('maximum_marks',0)) for r in cr)
            if max_c:participant_avgs.append(round(total_c/max_c*100,2))
    pos=1+sum(1 for x in participant_avgs if x>avg)
    existing=next((r for r in rows('report-cards')
                   if r.payload.get('student_id')==st['id']
                   and r.payload.get('session_id')==sess
                   and r.payload.get('term_id')==term),None)
    rid=existing.payload['id'] if existing else f"rc-{secrets.token_hex(6)}"
    code=existing.payload.get('verification_code') if existing else f"EDS-RC-{st.get('admission_number','').replace('/','')}-{secrets.token_hex(3).upper()}"
    card={'id':rid,'student_id':st['id'],'session_id':sess,'term_id':term,'school_id':st['school_id'],
          'class_id':st['class_id'],'total_marks':total,'max_possible':mx,'average_percent':avg,'position':pos,
          'total_students':len(participant_avgs),'attendance_present':st.get('attendance_days',0),
          'attendance_total':st.get('total_days',0),'conduct_grade':st.get('conduct_rating',''),
          'teacher_comment':'','principal_comment':'','promotion_status':'Under Review',
          'verification_code':code,'issued_at':existing.payload.get('issued_at',now()) if existing else now(),
          'subjects':subjects}
    if existing:
        existing.payload=card; flag_modified(existing,'payload')
    else: put('report-cards',card,rid)
    audit(current_user().get('username','system'),'GENERATE','report-card',rid,new=card,ip=request.remote_addr)
    db.session.commit()
    return jsonify(card),200 if existing else 201

@api.get('/verify/report-card/<code>')
def verify_report_card(code):
    r=next((x.payload for x in rows('report-cards') if x.payload.get('verification_code')==code),None)
    if not r:return jsonify(valid=False,error='Verification code not found'),404
    digest=canonical_hash({k:r.get(k) for k in ('student_id','session_id','term_id','total_marks','max_possible','verification_code')})
    return jsonify(valid=True,report_card=r,integrity_hash=digest)

@api.post('/students/bulk-enroll')
@auth_required
def bulk_enroll():
    items=(request.get_json(silent=True) or {}).get('students',[]); created=[]
    existing={str(x.payload.get('admission_number','')).lower() for x in rows('students')}
    for i,item in enumerate(items):
        adm=str(item.get('admission_number') or f"EDS/ENR/{datetime.now().year}/{secrets.token_hex(3).upper()}").strip()
        if adm.lower() in existing: continue
        item={**item,'id':item.get('id') or f"stu-{secrets.token_hex(6)}",'admission_number':adm,'status':item.get('status','active')}; put('students',item,item['id']); created.append(item); existing.add(adm.lower())
    db.session.commit(); return jsonify(created=created,count=len(created))

@api.post('/students/bulk-promote')
@auth_required
def bulk_promote():
    d=request.get_json(silent=True) or {}; ids=d.get('student_ids',[]); changed=[]
    for sid in ids:
        r=get('students',sid)
        if not r: continue
        old=r.payload.get('class_id'); r.payload['class_id']=d.get('new_class_id',old); r.payload.setdefault('promotion_history',[]).append({'date':now(),'from_class_id':old,'to_class_id':r.payload['class_id'],'session_id':d.get('session_id'),'note':d.get('note'),'authorized_by':get_jwt_identity()}); flag_modified(r,'payload'); changed.append(r.payload)
    db.session.commit(); return jsonify(updated=changed,count=len(changed))

@api.post('/students/bulk-transfer')
@auth_required
def bulk_transfer():
    d=request.get_json(silent=True) or {}; ids=d.get('student_ids',[]); changed=[]
    for sid in ids:
        r=get('students',sid)
        if not r: continue
        old=r.payload.get('school_id'); new=d.get('new_school_id'); r.payload['school_id']=new; r.payload['status']='transferred'; r.payload.setdefault('transfer_history',[]).append({'date':now(),'from_school_id':old,'to_school_id':new,'reason':d.get('reason'),'authorized_by':get_jwt_identity()}); flag_modified(r,'payload'); changed.append(r.payload)
    db.session.commit(); return jsonify(updated=changed,count=len(changed))

@api.post('/students/bulk-archive')
@auth_required
def bulk_archive():
    d=request.get_json(silent=True) or {}; ids=d.get('student_ids',[]); changed=[]
    for sid in ids:
        r=get('students',sid)
        if r: r.payload['status']='archived'; r.payload['archive_reason']=d.get('reason','Administrative cohort archival.'); flag_modified(r,'payload'); changed.append(r.payload)
    db.session.commit(); return jsonify(updated=changed,count=len(changed))

@api.post('/students/bulk-delete')
@roles_required('super-admin','director')
def bulk_delete_students():
    ids=(request.get_json(silent=True) or {}).get('student_ids',[]); n=0
    for sid in ids:
        if delete('students',sid): n+=1
    db.session.commit(); return jsonify(deleted=n)

@api.post('/examinations/<exam_id>/questions/bulk')
@auth_required
def bulk_questions(exam_id):
    if not payload('examinations',exam_id): return jsonify(error='Examination not found'),404
    d=request.get_json(silent=True) or {}; if_replace=bool(d.get('replaceExisting'))
    if if_replace:
        for r in list(rows('questions')):
            if r.payload.get('examination_id')==exam_id: db.session.delete(r)
    created=[]
    existing=max([int(r.payload.get('question_number',0)) for r in rows('questions') if r.payload.get('examination_id')==exam_id] or [0])
    for i,q in enumerate(d.get('questions',[]),1):
        item={**q,'id':q.get('id') or f"q-{secrets.token_hex(6)}",'examination_id':exam_id,'question_number':q.get('question_number') or existing+i,'verified':bool(q.get('verified',False))}; put('questions',item,item['id']); created.append(item)
    db.session.commit(); return jsonify(created=created,count=len(created))

@api.post('/candidate/access')
def candidate_access():
    """Authenticate a pupil by exact admission number and issue a short-lived candidate token.

    The candidate must have an actual generated paper for the selected examination.
    Candidate names are never returned by this endpoint and are never used as credentials.
    """
    d=request.get_json(silent=True) or {}
    exam_id=str(d.get('examination_id') or '').strip()
    admission=(d.get('admission_number') or '').strip().upper()
    if not exam_id or not admission:
        return jsonify(error='Enter your admission number.'),400
    exam=payload('examinations',exam_id)
    if not exam or exam.get('status') in {'draft','questions_verified','scheme_locked','submitted_for_approval','changes_requested','rejected','finalized'}:
        return jsonify(error='This examination is not available for candidates.'),403
    student=next((r.payload for r in rows('students') if str(r.payload.get('admission_number','')).strip().upper()==admission),None)
    if not student:
        return jsonify(error='Invalid admission number or candidate is not eligible for this examination.'),403
    paper=next((r.payload for r in rows('student-papers') if r.payload.get('examination_id')==exam_id and r.payload.get('student_id')==student.get('id') and r.payload.get('status') in {'generated','distributed','collected','scanned'}),None)
    if not paper:
        return jsonify(error='Invalid admission number or candidate is not eligible for this examination.'),403
    if paper.get('cbt_status') in {'submitted','graded'}:
        return jsonify(error='This candidate has already submitted this examination.'),409
    token=create_access_token(identity=f"candidate:{student['id']}", additional_claims={
        'role':'candidate','student_id':student['id'],'school_id':student.get('school_id'),
        'paper_id':paper['id'],'examination_id':exam_id
    }, expires_delta=timedelta(minutes=120))
    return jsonify(access_token=token,paper_id=paper['id'],student_id=student['id'])

@api.post('/student-papers/<paper_id>/cbt-submit')
@auth_required
def cbt_submit(paper_id):
    r=get('student-papers',paper_id); d=request.get_json(silent=True) or {}
    if not r:return jsonify(error='Paper not found'),404
    if r.payload.get('status')=='enrolled':return jsonify(error='Candidate paper has not been generated yet.'),409
    if r.payload.get('cbt_status') in {'submitted','graded'}:
        existing=next((x.payload for x in rows('results')
                       if x.payload.get('examination_id')==r.payload.get('examination_id')
                       and x.payload.get('student_id')==r.payload.get('student_id')),None)
        return jsonify(error='This examination has already been submitted.',result=existing,
                       score=r.payload.get('cbt_score',0),
                       maximum_marks=(payload('examinations',r.payload.get('examination_id')) or {}).get('maximum_marks',0),
                       percentage=(existing or {}).get('percentage',0)),409
    claims=get_jwt()
    if claims.get('role')=='candidate':
        if str(claims.get('student_id')) != str(r.payload.get('student_id')) or str(claims.get('paper_id')) != str(paper_id) or str(claims.get('examination_id')) != str(r.payload.get('examination_id')):
            return jsonify(error='This examination paper does not belong to the authenticated candidate.'),403
    elif not school_visible(r.payload,current_user()): return jsonify(error='Forbidden'),403

    exam=payload('examinations',r.payload.get('examination_id'))
    if not exam:return jsonify(error='Associated examination not found.'),404
    if exam.get('status') == 'finalized' and get_jwt().get('role') != 'super-admin':
        return jsonify(error='This examination has already been finalized and is closed to candidate submissions.'),409
    qmap={x.payload['id']:x.payload for x in rows('questions') if x.payload.get('examination_id')==exam.get('id')}
    assigned=r.payload.get('assigned_question_ids') or list(qmap)
    qs=[qmap[qid] for qid in assigned if qid in qmap]
    answers=d.get('answers',{}) or {}
    total=0; script_answers=[]; has_theory=False
    sid=f"scr-cbt-{paper_id}"
    for q in qs:
        resp=str(answers.get(q['id'],'')).strip()
        earned=0
        status='finalized'
        if q.get('question_type')=='objective':
            if resp.upper()==str(q.get('correct_answer','')).strip().upper(): earned=float(q.get('maximum_marks',0))
        else:
            has_theory=True
            # Provisional score is displayed immediately but remains subject to examiner moderation.
            if resp: earned=float(deterministic_theory(q.get('text',''),resp,q.get('expected_answer',''),int(q.get('maximum_marks',0))).get('proposedScore',0))
            status='proposed'
        total+=earned
        script_answers.append({'id':f"sa-cbt-{paper_id}-{q['id']}",'script_id':sid,'question_id':q['id'],
                              'student_raw_response':resp,
                              'detected_mcq_choice':resp.upper()[:1] if q.get('question_type')=='objective' else None,
                              'proposed_score':earned,'confidence':1.0 if q.get('question_type')=='objective' else .88,
                              'final_score':earned if q.get('question_type')=='objective' else None,
                              'status':status})
    pct=round(total/(float(exam.get('maximum_marks') or 1))*100,1)
    final_status='reviewed' if has_theory else 'finalized'
    r.payload.update(cbt_status='submitted',cbt_answers=answers,cbt_score=total,
                     cbt_auto_marked=True,cbt_submitted_at=now(),status='collected')
    flag_modified(r,'payload')

    existing_script=next((x for x in rows('answer-scripts') if x.payload.get('paper_id')==paper_id),None)
    script={'id':existing_script.payload['id'] if existing_script else sid,'paper_id':paper_id,
            'examination_id':exam['id'],'student_id':r.payload['student_id'],'intake_type':'digital',
            'status':'marked','review_status':'pending_review' if has_theory else 'examiner_approved',
            'score':total,'maximum_marks':exam.get('maximum_marks',0),'answers':script_answers,'created_at':now()}
    if existing_script:
        existing_script.payload=script; flag_modified(existing_script,'payload')
    else: put('answer-scripts',script,script['id'])

    existing_result=next((x for x in rows('results')
                          if x.payload.get('examination_id')==exam['id']
                          and x.payload.get('student_id')==r.payload['student_id']),None)
    result={'id':existing_result.payload['id'] if existing_result else f"res-cbt-{paper_id}",
            'examination_id':exam['id'],'student_id':r.payload['student_id'],
            'raw_marks':total,'maximum_marks':exam.get('maximum_marks',0),'percentage':pct,
            'grade':grade_for(pct),'position':0,'status':final_status}
    if final_status=='finalized':
        result.update(finalized_at=now(),finalized_by='CBT Automated Marking Engine')
    if existing_result:
        existing_result.payload.update(result); flag_modified(existing_result,'payload')
    else: put('results',result,result['id'])

    audit(current_user().get('username','candidate'),'SUBMIT','student-paper',paper_id,
          new={'score':total,'percentage':pct,'has_theory':has_theory},ip=request.remote_addr)
    db.session.commit()
    return jsonify(paper=r.payload,result=result,score=total,maximum_marks=exam.get('maximum_marks',0),percentage=pct,
                   message='Examination submitted successfully. Score displayed immediately; theory responses remain subject to examiner moderation.' if has_theory
                           else 'Examination submitted successfully. Objective score finalized immediately.')

@api.post('/examinations/<exam_id>/pipeline')
@auth_required
def complete_pipeline(exam_id):
    # One transactionally coordinated path for imported questions + scheme + rubric + candidate papers.
    d=request.get_json(silent=True) or {}; exam=payload('examinations',exam_id)
    if not exam:return jsonify(error='Examination not found'),404
    if exam.get('status') in {'approved','finalized'} and get_jwt().get('role') != 'super-admin':
        return jsonify(error='Approved/finalized examinations are locked; pipeline changes require a new draft/change-request cycle.'),409
    questions=d.get('questions',[])
    if questions:
        for q in questions:
            item={**q,'id':q.get('id') or f"q-{secrets.token_hex(6)}",'examination_id':exam_id,'verified':True}; put('questions',item,item['id'])
    db.session.commit()
    # Build the scheme directly so the pipeline does not depend on HTTP recursion.
    qs=sorted([x.payload for x in rows('questions') if x.payload.get('examination_id')==exam_id],key=lambda x:x.get('question_number',0)); sid=f'ms-{secrets.token_hex(6)}'; criteria=[]
    for i,q in enumerate(qs): criteria.append({'id':f'mc-{secrets.token_hex(5)}','marking_scheme_id':sid,'question_id':q['id'],'label':f"Question {q.get('question_number',i+1)}",'guidance':q.get('expected_answer',''),'marks':q.get('maximum_marks',0),'order_no':i+1})
    scheme={'id':sid,'examination_id':exam_id,'version':1,'status':'locked','hash':canonical_hash(criteria),'is_hidden':False,'is_deleted':False,'created_by':get_jwt_identity(),'locked_at':now(),'criteria':criteria}; put('marking-schemes',scheme,sid)
    db.session.commit(); return jsonify(examination=exam,questions=qs,marking_scheme=scheme)

# ---- AI -------------------------------------------------------------------
@api.post('/gemini/evaluate-theory')
@auth_required
def ai_theory():
    d=request.get_json(silent=True) or {}; q=d.get('question'); response=d.get('studentResponse'); expected=d.get('expectedAnswer',''); maxm=int(d.get('maximumMarks') or 10)
    if not q or not response:return jsonify(error='Question and Student Response are required'),400
    key=os.getenv('GEMINI_API_KEY')
    if not key:return jsonify(deterministic_theory(q,response,expected,maxm))
    try:
        from google import genai
        from google.genai import types
        client=genai.Client(api_key=key); prompt=f'''You are a senior Edo State Ministry of Education examiner. Mark the response against the question and model answer. Award an integer 0-{maxm}. Return JSON with proposedScore, confidence, evidence, missingConcepts, reasoning. Question: {q}\nExpected: {expected}\nStudent: {response}'''
        out=client.models.generate_content(model=os.getenv('AI_MODEL','gemini-2.5-flash'),contents=prompt,config=types.GenerateContentConfig(response_mime_type='application/json'))
        import json; result=json.loads(out.text); result['proposedScore']=max(0,min(maxm,int(result.get('proposedScore',0)))); result['evaluatedBy']='Gemini AI Marking Engine'; return jsonify(result)
    except Exception as e: return jsonify(error='AI evaluation failed',detail=str(e) if os.getenv('FLASK_ENV')!='production' else None),502

@api.post('/gemini/parse-exam-document')
@auth_required
def ai_parse():
    d=request.get_json(silent=True) or {}; text=d.get('documentText','') or ''; filedata=d.get('fileData') or d.get('fileBase64')
    if not text and not filedata:return jsonify(error='documentText or fileData is required'),400
    def local_parse(source_text):
        import re
        lines=[ln.strip() for ln in str(source_text).replace('\r','').split('\n')]
        nonempty=[ln for ln in lines if ln]
        title=next((ln for ln in nonempty if 'EXAMINATION' in ln.upper() or 'ASSESSMENT' in ln.upper()), 'Imported Examination Document')
        dm=re.search(r'(?:TIME ALLOWED|DURATION|TIME)\s*[:\-]\s*(\d+)\s*(?:MIN(?:UTES?)?|HOURS?)',str(source_text),re.I)
        tm=re.search(r'(?:TOTAL\s*MARKS|MAX(?:IMUM)?\s*MARKS)\s*[:\-]\s*(\d+(?:\.\d+)?)',str(source_text),re.I)
        questions=[]; cur=None
        for line in lines:
            m=re.match(r'^(\d+)[\.\)]\s+(.*)$',line)
            if m:
                if cur: questions.append(cur)
                cur={'question_number':int(m.group(1)),'question_type':'theory','text':m.group(2),'options':[],'maximum_marks':10}
                continue
            if cur:
                om=re.match(r'^([A-D])[\.\)]\s*(.*)$',line)
                if om: cur['options'].append({'key':om.group(1),'text':om.group(2)}); cur['question_type']='objective'; continue
                am=re.search(r'\[Answer\s*:\s*([^\],]+)',line,re.I)
                mm=re.search(r'\[Marks\s*:\s*(\d+(?:\.\d+)?)\]',line,re.I)
                lm=re.search(r'\[Lines\s*:\s*(\d+)\]',line,re.I)
                if am:
                    ans=am.group(1).strip()
                    if len(ans)<=3 and ans.upper() in {'A','B','C','D'}: cur['correct_answer']=ans.upper()
                    else: cur['expected_answer']=ans
                if mm: cur['maximum_marks']=float(mm.group(1))
                if lm: cur['answer_lines']=int(lm.group(1))
                if line.startswith('[Explanation:') or line.startswith('[Model Answer:'):
                    cur['expected_answer']=re.sub(r'^\[[^:]+:\s*|\]$','',line).strip()
        if cur: questions.append(cur)
        for q in questions:
            if q['question_type']=='objective' and not q['options']:
                q['question_type']='theory'
            if q['question_type']!='objective': q.pop('options',None); q.setdefault('answer_lines',8 if q['question_type']=='theory' else 4)
            q['maximum_marks']=int(q['maximum_marks']) if float(q['maximum_marks']).is_integer() else q['maximum_marks']
        duration=int(dm.group(1)) if dm else 90
        maximum=int(float(tm.group(1))) if tm else sum(q['maximum_marks'] for q in questions)
        return {'title':title,'examTitle':title,'subject_hint':d.get('defaultSubject','General Studies'),'class_hint':d.get('defaultClass','Primary 6'),'instructions':'Answer all questions clearly.','duration_minutes':duration,'durationMinutes':duration,'maximum_marks':maximum,'totalMarks':maximum,'questions':questions,'source':'EARPMS deterministic local parser'}
    # Pasted/text documents are parsed locally first. This is deterministic and avoids
    # waiting on an external AI request for documents the application can already parse.
    if text.strip():
        parsed = local_parse(text)
        if parsed.get('questions'):
            return jsonify(parsed)

    key=os.getenv('GEMINI_API_KEY')
    if not key:
        return jsonify(error='Gemini is not configured for binary document parsing. Paste extracted text or configure GEMINI_API_KEY.'),503
    try:
        from google import genai
        from google.genai import types
        client=genai.Client(api_key=key); prompt='Parse this examination document into JSON: title, subject_hint, class_hint, instructions, duration_minutes, maximum_marks, questions. Each question has question_number, question_type, text, options, correct_answer, expected_answer, maximum_marks.'
        contents=[prompt+'\n'+text]
        if filedata:
            contents=[types.Part.from_bytes(data=base64.b64decode(filedata),mime_type=d.get('mimeType','application/pdf')),prompt]
        out=client.models.generate_content(model=os.getenv('AI_MODEL','gemini-2.5-flash'),contents=contents,config=types.GenerateContentConfig(response_mime_type='application/json')); import json; parsed=json.loads(out.text); parsed['source']='Gemini AI Document Parser'; return jsonify(parsed)
    except Exception as e:return jsonify(error='Document parsing failed',detail=str(e) if os.getenv('FLASK_ENV')!='production' else None),502

@api.post('/gemini/generate-marking-and-rubric')
@auth_required
def ai_rubric():
    d=request.get_json(silent=True) or {}; qs=d.get('questions')
    if not isinstance(qs,list) or not qs:return jsonify(error='questions array is required'),400
    key=os.getenv('GEMINI_API_KEY')
    if not key:
        return jsonify(criteria=[{'question_id':q.get('id'),'question_number':q.get('question_number'),'label':f"Question {q.get('question_number')}",'guidance':q.get('expected_answer','Award marks for correct work.'),'marks':q.get('maximum_marks',0),'rubric_breakdown':[{'level':'Full Marks','points':q.get('maximum_marks',0),'description':'Complete and correct.'},{'level':'Partial Marks','points':q.get('maximum_marks',0)//2,'description':'Partially correct.'},{'level':'Zero Marks','points':0,'description':'Incorrect or blank.'}]} for q in qs],source='Rule-based scheme generator')
    try:
        from google import genai
        from google.genai import types
        client=genai.Client(api_key=key); prompt='Generate an official marking scheme and rubric as JSON for each question. Include question_number,label,guidance,marks,rubric_breakdown. Questions:\n'+__import__('json').dumps(qs)
        out=client.models.generate_content(model=os.getenv('AI_MODEL','gemini-2.5-flash'),contents=prompt,config=types.GenerateContentConfig(response_mime_type='application/json')); return jsonify(**__import__('json').loads(out.text),source='Gemini AI Marking Moderator')
    except Exception as e:return jsonify(error='Rubric generation failed',detail=str(e) if os.getenv('FLASK_ENV')!='production' else None),502
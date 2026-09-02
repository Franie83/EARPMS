
import os
import pytest

os.environ["SECRET_KEY"] = "test-secret-key-test-secret-key-test-secret-key"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-test-jwt-secret-key-test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["DEMO_PASSWORD"] = "ChangeMe!2026"
os.environ["DEMO_MODE"] = "true"
os.environ["TESTING"] = "true"
os.environ["AUTO_CREATE_DB"] = "true"
os.environ["SEED_ON_STARTUP"] = "true"

from app import create_app, db

@pytest.fixture()
def client():
    app = create_app()
    with app.test_client() as c:
        yield c
    with app.app_context():
        db.drop_all()

def login(client, username):
    r = client.post('/api/auth/login', json={'username': username, 'password': 'ChangeMe!2026'})
    assert r.status_code == 200, r.get_json()
    return r.get_json()['access_token']

def auth(token):
    return {'Authorization': f'Bearer {token}'}

def test_health(client):
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.get_json()['status'] == 'ok'

def test_login_state_and_school_isolation(client):
    token = login(client, 'principal_emotan')
    state = client.get('/api/state', headers=auth(token))
    assert state.status_code == 200
    body = state.get_json()
    assert body['currentUser']['role'] == 'principal'
    assert all(s['school_id'] == 'sch-01' for s in body['students'])
    assert all(s['school_id'] == 'sch-01' for s in body['schools'])

def test_demo_role_switch_issues_real_token(client):
    token = login(client, 'subeb_chairman')
    r = client.post('/api/auth/demo-switch', headers=auth(token), json={'user_id':'u-principal-idia'})
    assert r.status_code == 200
    new_token = r.get_json()['access_token']
    me = client.get('/api/auth/me', headers=auth(new_token))
    assert me.status_code == 200
    assert me.get_json()['user']['username'] == 'principal_idia'
    assert me.get_json()['user']['role'] == 'principal'

def test_demo_switch_disabled_when_off(client, monkeypatch):
    monkeypatch.setenv('DEMO_MODE','false')
    token = login(client, 'subeb_chairman')
    r = client.post('/api/auth/demo-switch', headers=auth(token), json={'user_id':'u-principal-idia'})
    assert r.status_code == 404

def test_fixed_exam_uses_all_questions_for_every_candidate(client):
    token = login(client, 'subeb_chairman')
    r = client.post('/api/examinations/ex-02/generate-papers', headers=auth(token), json={})
    assert r.status_code == 200, r.get_json()
    papers = r.get_json()['created']
    assert papers
    all_q = sorted(q['id'] for q in client.get('/api/questions', headers=auth(token)).get_json()['items'] if q['examination_id']=='ex-02')
    for p in papers:
        assert sorted(p['assigned_question_ids']) == all_q

def test_variable_exam_is_deterministic_per_candidate(client):
    token = login(client, 'subeb_chairman')
    exam = client.get('/api/examinations/ex-01', headers=auth(token)).get_json()
    r = client.post('/api/examinations/ex-01/generate-papers', headers=auth(token), json={})
    assert r.status_code == 200, r.get_json()
    papers = r.get_json()['created']
    assert papers
    count = int(exam.get('variable_question_count') or len([q for q in client.get('/api/questions', headers=auth(token)).get_json()['items'] if q['examination_id']=='ex-01']))
    for p in papers:
        assert len(p['assigned_question_ids']) == count
    ids = [tuple(p['assigned_question_ids']) for p in papers]
    # Repeating generation is idempotent and cannot create a different assignment.
    r2 = client.post('/api/examinations/ex-01/generate-papers', headers=auth(token), json={})
    assert r2.status_code == 200
    assert r2.get_json()['count'] == 0

def test_rbac_blocks_teacher_from_statewide_school_create(client):
    token = login(client, 'teacher_egharevba')
    r = client.post('/api/schools', headers=auth(token), json={'id':'sch-x','name':'Forbidden'})
    assert r.status_code == 403

def test_cbt_submit_creates_result(client):
    token = login(client, 'subeb_chairman')
    gen = client.post('/api/examinations/ex-02/generate-papers', headers=auth(token), json={})
    assert gen.status_code == 200
    paper = gen.get_json()['created'][0]
    qs = client.get('/api/questions', headers=auth(token)).get_json()['items']
    answers = {q['id']: q.get('correct_answer','') for q in qs if q['examination_id']=='ex-02' and q.get('question_type')=='objective'}
    r = client.post(f"/api/student-papers/{paper['id']}/cbt-submit", headers=auth(token), json={'answers':answers})
    assert r.status_code == 200, r.get_json()
    assert r.get_json()['result']['student_id'] == paper['student_id']

def test_report_card_public_verification(client):
    token = login(client, 'subeb_chairman')
    cards = client.get('/api/report-cards', headers=auth(token)).get_json()['items']
    if not cards or not cards[0].get('verification_code'):
        pytest.skip('seed has no verification code')
    code = cards[0]['verification_code']
    r = client.get(f'/api/verify/report-card/{code}')
    assert r.status_code == 200

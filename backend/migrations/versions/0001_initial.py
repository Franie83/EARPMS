
"""initial earpms schema"""
from alembic import op
import sqlalchemy as sa
revision='0001_initial'; down_revision=None; branch_labels=None; depends_on=None

def upgrade():
    op.create_table('records',
        sa.Column('id',sa.String(length=128),nullable=False), sa.Column('resource',sa.String(length=64),nullable=False),
        sa.Column('payload',sa.JSON(),nullable=False), sa.Column('created_at',sa.DateTime(timezone=True),nullable=False),
        sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False), sa.PrimaryKeyConstraint('id','resource'))
    op.create_index('ix_records_resource','records',['resource'])
    op.create_table('credentials',sa.Column('user_id',sa.String(length=128),nullable=False),sa.Column('password_hash',sa.String(length=255),nullable=False),sa.Column('last_login_at',sa.DateTime(timezone=True)),sa.PrimaryKeyConstraint('user_id'))
    op.create_table('audit_events',sa.Column('id',sa.Integer(),autoincrement=True,nullable=False),sa.Column('timestamp',sa.DateTime(timezone=True),nullable=False),sa.Column('actor',sa.String(length=128),nullable=False),sa.Column('action',sa.String(length=64),nullable=False),sa.Column('entity_type',sa.String(length=128),nullable=False),sa.Column('entity_id',sa.String(length=128),nullable=False),sa.Column('description',sa.Text()),sa.Column('old_value',sa.JSON()),sa.Column('new_value',sa.JSON()),sa.Column('ip_address',sa.String(length=64)),sa.PrimaryKeyConstraint('id'))

def downgrade():
    op.drop_table('audit_events'); op.drop_table('credentials'); op.drop_index('ix_records_resource',table_name='records'); op.drop_table('records')

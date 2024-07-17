"""Initial migration.

Revision ID: d5f09c3bdce2
Revises: 
Create Date: 2024-07-17 10:25:07.019114

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5f09c3bdce2'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('entity',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('attribute',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('entity_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('key', sa.String(length=10), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('relationship',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('parent_entity_id', sa.Integer(), nullable=False),
    sa.Column('child_entity_id', sa.Integer(), nullable=False),
    sa.Column('parent_cardinality', sa.String(length=10), nullable=True),
    sa.Column('child_cardinality', sa.String(length=10), nullable=True),
    sa.ForeignKeyConstraint(['child_entity_id'], ['entity.id'], ),
    sa.ForeignKeyConstraint(['parent_entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('relationship')
    op.drop_table('attribute')
    op.drop_table('entity')
    # ### end Alembic commands ###

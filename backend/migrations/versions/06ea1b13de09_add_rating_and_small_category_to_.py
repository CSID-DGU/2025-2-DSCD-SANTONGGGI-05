"""add rating and small category to products

Revision ID: 06ea1b13de09
Revises: 20241102_06
Create Date: 2025-11-16 16:53:48.362595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06ea1b13de09'
down_revision: Union[str, None] = '20241102_06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("small_category", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("rating", sa.Numeric(3, 2), nullable=True))
    op.add_column("products", sa.Column("image_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "image_url")
    op.drop_column("products", "rating")
    op.drop_column("products", "small_category")

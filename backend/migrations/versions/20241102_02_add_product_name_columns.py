"""add product name columns to cart and purchase history

Revision ID: 20241102_02
Revises: 20241102_01
Create Date: 2025-11-02 08:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20241102_02"
down_revision = "20241102_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cart_items",
        sa.Column("name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "purchase_history",
        sa.Column("name", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("purchase_history", "name")
    op.drop_column("cart_items", "name")


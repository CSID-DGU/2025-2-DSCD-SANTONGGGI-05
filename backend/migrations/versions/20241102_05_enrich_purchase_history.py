"""Add category to cart items and media fields to purchase history."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20241102_05"
down_revision = "20241102_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cart_items",
        sa.Column("category", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "purchase_history",
        sa.Column("image_url", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "purchase_history",
        sa.Column("product_url", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("purchase_history", "product_url")
    op.drop_column("purchase_history", "image_url")
    op.drop_column("cart_items", "category")

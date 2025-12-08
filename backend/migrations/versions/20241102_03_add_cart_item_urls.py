"""add image and product url to cart items

Revision ID: 20241102_03
Revises: 20241102_02
Create Date: 2025-11-02 09:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20241102_03"
down_revision = "20241102_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "cart_items",
        sa.Column("image_url", sa.String(length=512), nullable=False, server_default=""),
    )
    op.add_column(
        "cart_items",
        sa.Column("product_url", sa.String(length=512), nullable=False, server_default=""),
    )

    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        # Remove server defaults to keep application-level validation in control
        op.alter_column("cart_items", "image_url", server_default=None)
        op.alter_column("cart_items", "product_url", server_default=None)


def downgrade() -> None:
    op.drop_column("cart_items", "product_url")
    op.drop_column("cart_items", "image_url")

"""remove product foreign keys from cart and history

Revision ID: 20241102_04
Revises: 20241102_03
Create Date: 2025-11-07 09:35:00.000000
"""

from alembic import op
from sqlalchemy.engine import reflection


# revision identifiers, used by Alembic.
revision = "20241102_04"
down_revision = "20241102_03"
branch_labels = None
depends_on = None


def _drop_fk(table_name: str, target_column: str) -> None:
    bind = op.get_bind()
    inspector = reflection.Inspector.from_engine(bind)
    fk_name = None

    for fk in inspector.get_foreign_keys(table_name):
        constrained = fk.get("constrained_columns") or []
        if target_column in constrained:
            fk_name = fk.get("name")
            break

    with op.batch_alter_table(table_name) as batch_op:
        batch_op.drop_constraint(fk_name, type_="foreignkey")


def upgrade() -> None:
    """Drop FK constraints so external product ids can be stored."""
    _drop_fk("cart_items", "product_id")
    _drop_fk("purchase_history", "product_id")


def downgrade() -> None:
    """Restore FK constraints if needed."""
    with op.batch_alter_table("cart_items") as batch_op:
        batch_op.create_foreign_key(
            "cart_items_product_id_fkey",
            referent_table="products",
            local_cols=["product_id"],
            remote_cols=["id"],
            ondelete="CASCADE",
        )

    with op.batch_alter_table("purchase_history") as batch_op:
        batch_op.create_foreign_key(
            "purchase_history_product_id_fkey",
            referent_table="products",
            local_cols=["product_id"],
            remote_cols=["id"],
            ondelete="SET NULL",
        )

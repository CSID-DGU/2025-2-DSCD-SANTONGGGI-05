"""Change purchase_history.date to timestamptz."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20241102_06"
down_revision = "20241102_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("purchase_history") as batch_op:
        batch_op.alter_column(
            "date",
            existing_type=sa.Date(),
            type_=sa.DateTime(timezone=True),
            postgresql_using="date::timestamptz",
        )


def downgrade() -> None:
    with op.batch_alter_table("purchase_history") as batch_op:
        batch_op.alter_column(
            "date",
            existing_type=sa.DateTime(timezone=True),
            type_=sa.Date(),
            postgresql_using="date::date",
        )

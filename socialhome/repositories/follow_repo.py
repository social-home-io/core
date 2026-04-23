"""Follow repository — ``following_spaces`` (user-side public-space
bookmarks).

Follows are a user's personal bookmark list of public spaces they
want to see in their discovery / follows feed. Not federated — the
list lives on the user's HFS and never leaves it. Distinct from
``space_members``: following is weaker than membership, and the
space's host HFS doesn't need to know.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from ..db import AsyncDatabase


@runtime_checkable
class AbstractFollowRepo(Protocol):
    async def follow(self, user_id: str, space_id: str) -> None: ...
    async def unfollow(self, user_id: str, space_id: str) -> None: ...
    async def is_following(self, user_id: str, space_id: str) -> bool: ...
    async def list_follows(self, user_id: str) -> list[dict]: ...


class SqliteFollowRepo:
    """SQLite-backed :class:`AbstractFollowRepo`."""

    __slots__ = ("_db",)

    def __init__(self, db: AsyncDatabase) -> None:
        self._db = db

    async def follow(self, user_id: str, space_id: str) -> None:
        # Idempotent — tapping "follow" twice must not error.
        await self._db.enqueue(
            "INSERT OR IGNORE INTO following_spaces(user_id, space_id) VALUES(?, ?)",
            (user_id, space_id),
        )

    async def unfollow(self, user_id: str, space_id: str) -> None:
        await self._db.enqueue(
            "DELETE FROM following_spaces WHERE user_id=? AND space_id=?",
            (user_id, space_id),
        )

    async def is_following(self, user_id: str, space_id: str) -> bool:
        row = await self._db.fetchone(
            "SELECT 1 FROM following_spaces WHERE user_id=? AND space_id=?",
            (user_id, space_id),
        )
        return row is not None

    async def list_follows(self, user_id: str) -> list[dict]:
        """Return ``[{space_id, followed_at}, ...]`` newest first.

        Deliberately row-shaped rather than joining against ``spaces``:
        followed spaces may live on other HFS instances and not be
        locally-mirrored, so ``space_id`` is all we can guarantee. The
        caller (UI) hydrates against its own public-space cache.
        """
        rows = await self._db.fetchall(
            "SELECT space_id, followed_at FROM following_spaces"
            " WHERE user_id=? ORDER BY followed_at DESC",
            (user_id,),
        )
        return [
            {"space_id": r["space_id"], "followed_at": r["followed_at"]} for r in rows
        ]

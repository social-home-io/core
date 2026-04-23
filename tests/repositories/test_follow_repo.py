"""Tests for :mod:`socialhome.repositories.follow_repo`."""

from __future__ import annotations

import pytest

from socialhome.crypto import derive_instance_id, generate_identity_keypair
from socialhome.db.database import AsyncDatabase
from socialhome.repositories.follow_repo import SqliteFollowRepo


@pytest.fixture
async def env(tmp_dir):
    kp = generate_identity_keypair()
    iid = derive_instance_id(kp.public_key)
    db = AsyncDatabase(tmp_dir / "t.db", batch_timeout_ms=10)
    await db.startup()
    await db.enqueue(
        "INSERT INTO instance_identity(instance_id, identity_private_key,"
        " identity_public_key, routing_secret) VALUES(?,?,?,?)",
        (iid, kp.private_key.hex(), kp.public_key.hex(), "aa" * 32),
    )
    await db.enqueue(
        "INSERT INTO users(username, user_id, display_name)"
        " VALUES('alice', 'uid-alice', 'Alice')",
    )
    await db.enqueue(
        "INSERT INTO users(username, user_id, display_name)"
        " VALUES('bob', 'uid-bob', 'Bob')",
    )

    class E:
        pass

    e = E()
    e.db = db
    e.repo = SqliteFollowRepo(db)
    yield e
    await db.shutdown()


async def test_is_following_default_false(env):
    assert await env.repo.is_following("uid-alice", "sp-1") is False


async def test_follow_is_idempotent(env):
    await env.repo.follow("uid-alice", "sp-1")
    await env.repo.follow("uid-alice", "sp-1")  # must not raise
    assert await env.repo.is_following("uid-alice", "sp-1") is True
    assert len(await env.repo.list_follows("uid-alice")) == 1


async def test_unfollow_then_follow_round_trip(env):
    await env.repo.follow("uid-alice", "sp-1")
    await env.repo.unfollow("uid-alice", "sp-1")
    assert await env.repo.is_following("uid-alice", "sp-1") is False
    await env.repo.follow("uid-alice", "sp-1")
    assert await env.repo.is_following("uid-alice", "sp-1") is True


async def test_unfollow_missing_is_noop(env):
    """Unfollowing a space you've never followed must not error."""
    await env.repo.unfollow("uid-alice", "never-followed")
    assert await env.repo.list_follows("uid-alice") == []


async def test_list_follows_scoped_per_user(env):
    await env.repo.follow("uid-alice", "sp-a")
    await env.repo.follow("uid-bob", "sp-b")
    alice = await env.repo.list_follows("uid-alice")
    bob = await env.repo.list_follows("uid-bob")
    assert [r["space_id"] for r in alice] == ["sp-a"]
    assert [r["space_id"] for r in bob] == ["sp-b"]


async def test_list_follows_newest_first(env):
    """``list_follows`` orders by ``followed_at DESC``."""
    # Stamp explicit timestamps to avoid ordering by same-second inserts.
    await env.db.enqueue(
        "INSERT INTO following_spaces(user_id, space_id, followed_at)"
        " VALUES('uid-alice', 'older', '2025-01-01T00:00:00Z')",
    )
    await env.db.enqueue(
        "INSERT INTO following_spaces(user_id, space_id, followed_at)"
        " VALUES('uid-alice', 'newer', '2026-01-01T00:00:00Z')",
    )
    rows = await env.repo.list_follows("uid-alice")
    assert [r["space_id"] for r in rows] == ["newer", "older"]

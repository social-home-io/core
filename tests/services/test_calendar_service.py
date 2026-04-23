"""Tests for socialhome.services.calendar_service."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from socialhome.crypto import generate_identity_keypair, derive_instance_id
from socialhome.db.database import AsyncDatabase
from socialhome.domain.calendar import (
    CalendarEvent,
    CalendarRSVP,
    CalendarVisibilityPref,
    RSVPStatus,
)
from socialhome.repositories.calendar_repo import (
    SqliteCalendarRepo,
    SqliteSpaceCalendarRepo,
)
from socialhome.services.calendar_service import CalendarService


@pytest.fixture
async def env(tmp_dir):
    """Env with calendar repos and service over a real SQLite database."""
    kp = generate_identity_keypair()
    iid = derive_instance_id(kp.public_key)
    db = AsyncDatabase(tmp_dir / "test.db", batch_timeout_ms=10)
    await db.startup()
    await db.enqueue(
        "INSERT INTO instance_identity(instance_id, identity_private_key,"
        " identity_public_key, routing_secret) VALUES(?,?,?,?)",
        (iid, kp.private_key.hex(), kp.public_key.hex(), "aa" * 32),
    )

    class Env:
        pass

    e = Env()
    e.db = db
    e.iid = iid
    e.cal_repo = SqliteCalendarRepo(db)
    e.space_cal_repo = SqliteSpaceCalendarRepo(db)
    e.cal_svc = CalendarService(e.cal_repo)
    yield e
    await db.shutdown()


async def test_personal_calendar_crud(env):
    """Create calendar, add event, query by range, delete."""
    await env.db.enqueue(
        "INSERT INTO users(username, user_id, display_name) VALUES(?,?,?)",
        ("anna", "uid-anna", "Anna"),
    )
    cal = await env.cal_svc.create_calendar(
        name="Personal", owner_username="anna", color="#FF0000"
    )
    assert cal.name == "Personal"

    now = datetime.now(timezone.utc)
    event = await env.cal_svc.create_event(
        calendar_id=cal.id,
        summary="Lunch",
        start=now.isoformat(),
        end=(now + timedelta(hours=1)).isoformat(),
        created_by="uid-anna",
    )
    assert event.summary == "Lunch"

    events = await env.cal_svc.list_events_in_range(
        cal.id,
        start=(now - timedelta(minutes=30)).isoformat(),
        end=(now + timedelta(hours=2)).isoformat(),
    )
    assert len(events) == 1

    no_events = await env.cal_svc.list_events_in_range(
        cal.id,
        start=(now - timedelta(hours=3)).isoformat(),
        end=(now - timedelta(hours=2)).isoformat(),
    )
    assert len(no_events) == 0

    await env.cal_svc.delete_event(event.id)
    with pytest.raises(KeyError):
        await env.cal_svc.get_event(event.id)

    await env.cal_svc.delete_calendar(cal.id)
    with pytest.raises(KeyError):
        await env.cal_svc.get_calendar(cal.id)


async def test_space_calendar_with_rsvps(env):
    """Space calendar event with RSVP going/decline/remove flow."""
    now = datetime.now(timezone.utc)

    kp = generate_identity_keypair()
    await env.db.enqueue(
        "INSERT INTO users(username, user_id, display_name) VALUES(?,?,?)",
        ("owner1", "uid-owner1", "Owner"),
    )
    await env.db.enqueue(
        """INSERT INTO spaces(
            id, name, owner_instance_id, owner_username, identity_public_key,
            config_sequence, space_type, join_mode
        ) VALUES(?,?,?,?,?,0,'private','invite_only')""",
        ("space-1", "TestSpace", env.iid, "owner1", kp.public_key.hex()),
    )

    event = CalendarEvent(
        id=uuid.uuid4().hex,
        calendar_id="space-1",
        summary="Team meeting",
        start=now,
        end=now + timedelta(hours=1),
        created_by="u1",
    )
    await env.space_cal_repo.save_event("space-1", event)

    rsvp_going = CalendarRSVP(
        event_id=event.id,
        user_id="u1",
        status=RSVPStatus.GOING,
        updated_at=now.isoformat(),
    )
    await env.space_cal_repo.upsert_rsvp(rsvp_going)
    rsvps = await env.space_cal_repo.list_rsvps(event.id)
    assert len(rsvps) == 1
    assert rsvps[0].status == RSVPStatus.GOING

    rsvp_declined = CalendarRSVP(
        event_id=event.id,
        user_id="u1",
        status=RSVPStatus.DECLINED,
        updated_at=now.isoformat(),
    )
    await env.space_cal_repo.upsert_rsvp(rsvp_declined)
    rsvps2 = await env.space_cal_repo.list_rsvps(event.id)
    assert rsvps2[0].status == RSVPStatus.DECLINED

    await env.space_cal_repo.remove_rsvp(event.id, "u1")
    rsvps3 = await env.space_cal_repo.list_rsvps(event.id)
    assert len(rsvps3) == 0


async def test_list_events_in_range(env):
    """list_events_in_range returns events within the given time window."""
    await env.db.enqueue(
        "INSERT INTO users(username,user_id,display_name) VALUES(?,?,?)",
        ("anna", "u1", "A"),
    )
    cal = await env.cal_svc.create_calendar(
        name="W", owner_username="anna", color="#00F"
    )
    now = datetime.now(timezone.utc)
    await env.cal_svc.create_event(
        calendar_id=cal.id,
        summary="E",
        start=now.isoformat(),
        end=(now + timedelta(hours=1)).isoformat(),
        created_by="u1",
    )
    events = await env.cal_svc.list_events_in_range(
        cal.id,
        start=(now - timedelta(hours=1)).isoformat(),
        end=(now + timedelta(hours=2)).isoformat(),
    )
    assert len(events) >= 1


async def test_create_calendar_empty_name_rejected(env):
    """Empty calendar name raises ValueError."""
    with pytest.raises(ValueError, match="empty"):
        await env.cal_svc.create_calendar(name="  ", owner_username="x")


async def test_get_nonexistent_calendar(env):
    """Getting a nonexistent calendar raises KeyError."""
    with pytest.raises(KeyError):
        await env.cal_svc.get_calendar("nonexistent")


async def test_delete_nonexistent_calendar(env):
    """Deleting a nonexistent calendar raises KeyError."""
    with pytest.raises(KeyError):
        await env.cal_svc.delete_calendar("nonexistent")


async def test_create_event_empty_summary(env):
    """Empty event summary raises ValueError."""
    await env.db.enqueue(
        "INSERT OR IGNORE INTO users(username,user_id,display_name) VALUES(?,?,?)",
        ("bob", "u2", "B"),
    )
    cal = await env.cal_svc.create_calendar(name="C", owner_username="bob")
    now = datetime.now(timezone.utc)
    with pytest.raises(ValueError, match="empty"):
        await env.cal_svc.create_event(
            calendar_id=cal.id,
            summary="  ",
            start=now.isoformat(),
            end=(now + timedelta(hours=1)).isoformat(),
            created_by="u2",
        )


async def test_create_event_nonexistent_calendar(env):
    """Creating an event in a nonexistent calendar raises KeyError."""
    now = datetime.now(timezone.utc)
    with pytest.raises(KeyError):
        await env.cal_svc.create_event(
            calendar_id="nonexistent",
            summary="X",
            start=now.isoformat(),
            end=(now + timedelta(hours=1)).isoformat(),
            created_by="u1",
        )


async def test_create_event_end_before_start(env):
    """Event with end < start raises ValueError."""
    await env.db.enqueue(
        "INSERT OR IGNORE INTO users(username,user_id,display_name) VALUES(?,?,?)",
        ("carl", "u3", "C"),
    )
    cal = await env.cal_svc.create_calendar(name="C", owner_username="carl")
    now = datetime.now(timezone.utc)
    with pytest.raises(ValueError, match="before start"):
        await env.cal_svc.create_event(
            calendar_id=cal.id,
            summary="Bad",
            start=(now + timedelta(hours=2)).isoformat(),
            end=now.isoformat(),
            created_by="u3",
        )


async def test_create_event_invalid_datetime(env):
    """Invalid datetime string raises ValueError."""
    await env.db.enqueue(
        "INSERT OR IGNORE INTO users(username,user_id,display_name) VALUES(?,?,?)",
        ("dan", "u4", "D"),
    )
    cal = await env.cal_svc.create_calendar(name="C", owner_username="dan")
    with pytest.raises(ValueError, match="invalid datetime"):
        await env.cal_svc.create_event(
            calendar_id=cal.id,
            summary="X",
            start="not-a-date",
            end="also-not",
            created_by="u4",
        )


async def test_get_nonexistent_event(env):
    """Getting a nonexistent event raises KeyError."""
    with pytest.raises(KeyError):
        await env.cal_svc.get_event("nonexistent")


async def test_delete_nonexistent_event(env):
    """Deleting a nonexistent event raises KeyError."""
    with pytest.raises(KeyError):
        await env.cal_svc.delete_event("nonexistent")


async def test_list_calendars(env):
    """list_calendars returns calendars for the given user."""
    await env.db.enqueue(
        "INSERT OR IGNORE INTO users(username,user_id,display_name) VALUES(?,?,?)",
        ("eve", "u5", "E"),
    )
    await env.cal_svc.create_calendar(name="C1", owner_username="eve")
    cals = await env.cal_svc.list_calendars("eve")
    assert len(cals) >= 1


async def test_space_calendar_service_list(env):
    """SpaceCalendarService.list_events_in_range works."""
    from socialhome.services.calendar_service import SpaceCalendarService

    svc = SpaceCalendarService(env.space_cal_repo)
    # Need a space
    kp2 = generate_identity_keypair()
    await env.db.enqueue(
        "INSERT OR IGNORE INTO users(username,user_id,display_name) VALUES(?,?,?)",
        ("spown", "uid-sp", "SP"),
    )
    sid = uuid.uuid4().hex
    await env.db.enqueue(
        """INSERT INTO spaces(id, name, owner_instance_id, owner_username,
           identity_public_key, config_sequence, space_type, join_mode)
           VALUES(?,?,?,?,?,0,'private','invite_only')""",
        (sid, "SpCal", env.iid, "spown", kp2.public_key.hex()),
    )
    now = datetime.now(timezone.utc)
    events = await svc.list_events_in_range(
        sid,
        start=(now - timedelta(hours=1)).isoformat(),
        end=(now + timedelta(hours=1)).isoformat(),
    )
    assert isinstance(events, list)


# ─── CalendarService publishes domain events (B1) ─────────────────────


async def _seed_user(db, username="owner"):
    await db.enqueue(
        "INSERT OR IGNORE INTO users(username, user_id, display_name) VALUES(?,?,?)",
        (username, f"uid-{username}", username),
    )


async def test_create_event_publishes_calendar_event_created(env):
    """CalendarService.create_event publishes CalendarEventCreated on the bus."""
    from socialhome.domain.events import CalendarEventCreated

    class _RecordingBus:
        def __init__(self):
            self.events = []

        def subscribe(self, *a, **kw):
            pass

        async def publish(self, event):
            self.events.append(event)

    await _seed_user(env.db)
    bus = _RecordingBus()
    svc = CalendarService(env.cal_repo, bus=bus)
    cal = await svc.create_calendar(name="Test", owner_username="owner")
    now = datetime.now(timezone.utc)
    await svc.create_event(
        calendar_id=cal.id,
        summary="Dinner",
        start=now.isoformat(),
        end=(now + timedelta(hours=1)).isoformat(),
        created_by="uid-owner",
    )
    assert any(isinstance(e, CalendarEventCreated) for e in bus.events)


async def test_delete_event_publishes_calendar_event_deleted(env):
    """CalendarService.delete_event publishes CalendarEventDeleted on the bus."""
    from socialhome.domain.events import CalendarEventDeleted

    class _RecordingBus:
        def __init__(self):
            self.events = []

        def subscribe(self, *a, **kw):
            pass

        async def publish(self, event):
            self.events.append(event)

    await _seed_user(env.db, "deleter")
    bus = _RecordingBus()
    svc = CalendarService(env.cal_repo, bus=bus)
    cal = await svc.create_calendar(name="Del", owner_username="deleter")
    now = datetime.now(timezone.utc)
    event = await svc.create_event(
        calendar_id=cal.id,
        summary="To delete",
        start=now.isoformat(),
        end=(now + timedelta(hours=1)).isoformat(),
        created_by="uid-deleter",
    )
    await svc.delete_event(event.id)
    assert any(isinstance(e, CalendarEventDeleted) for e in bus.events)


# ── Visibility prefs ────────────────────────────────────────────────────────


async def test_visibility_prefs_round_trip(env):
    await env.db.enqueue(
        "INSERT INTO users(username, user_id, display_name) VALUES(?,?,?)",
        ("vera", "uid-vera", "Vera"),
    )
    prefs = [
        CalendarVisibilityPref(
            username="vera",
            calendar_ref="cal-a",
            calendar_type="personal",
            visible=True,
            position=0,
        ),
        CalendarVisibilityPref(
            username="vera",
            calendar_ref="space-z",
            calendar_type="space",
            visible=False,
            position=1,
        ),
    ]
    await env.cal_svc.set_visibility_prefs("vera", prefs)
    got = await env.cal_svc.list_visibility_prefs("vera")
    assert len(got) == 2
    assert got[0].visible is True
    assert got[1].visible is False


async def test_visibility_prefs_rejects_bad_type(env):
    with pytest.raises(ValueError):
        await env.cal_svc.set_visibility_prefs(
            "vera",
            [
                CalendarVisibilityPref(
                    username="vera",
                    calendar_ref="cal-a",
                    calendar_type="household",  # invalid
                ),
            ],
        )


async def test_visibility_prefs_rejects_empty_ref(env):
    with pytest.raises(ValueError):
        await env.cal_svc.set_visibility_prefs(
            "vera",
            [
                CalendarVisibilityPref(
                    username="vera",
                    calendar_ref="",
                    calendar_type="personal",
                ),
            ],
        )


async def test_visibility_prefs_clamps_negative_position(env):
    """Negative positions are coerced to 0 so the client can't
    inject a sort anomaly."""
    await env.db.enqueue(
        "INSERT INTO users(username, user_id, display_name) VALUES(?,?,?)",
        ("vi", "uid-vi", "Vi"),
    )
    await env.cal_svc.set_visibility_prefs(
        "vi",
        [
            CalendarVisibilityPref(
                username="vi",
                calendar_ref="cal-neg",
                calendar_type="personal",
                position=-5,
            ),
        ],
    )
    got = await env.cal_svc.list_visibility_prefs("vi")
    assert got[0].position == 0


async def test_visibility_prefs_overrides_username(env):
    """Client can't set prefs for a user other than the authenticated
    one — the service stamps the authoritative username."""
    await env.db.enqueue(
        "INSERT INTO users(username, user_id, display_name) VALUES(?,?,?)",
        ("real", "uid-real", "Real"),
    )
    await env.db.enqueue(
        "INSERT INTO users(username, user_id, display_name) VALUES(?,?,?)",
        ("fake", "uid-fake", "Fake"),
    )
    # Caller tries to write as 'fake' even though the service is called
    # with username='real'.
    await env.cal_svc.set_visibility_prefs(
        "real",
        [
            CalendarVisibilityPref(
                username="fake",
                calendar_ref="c1",
                calendar_type="personal",
            ),
        ],
    )
    assert await env.cal_svc.list_visibility_prefs("real")
    assert await env.cal_svc.list_visibility_prefs("fake") == []

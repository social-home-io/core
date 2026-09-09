"""Release-blocker protocol tests for mesh-routed space content (SPACE_ROUTED).

Marked ``@pytest.mark.security`` — CLAUDE.md requires these to run
before every commit touching federation code.

This file closes a real gap: ``tests/protocol/`` had **no** SPACE_ROUTED
coverage at all, which is why #648 (a mesh-joined member silently
receiving no post metadata) shipped. The unit suites exercise the happy
path; nothing pinned the invariants below.

Coverage:
* **A relay can never unseal.** The end-to-end seal is bound to the
  target's ephemeral X25519 pub, so a household sitting between host and
  member holds ciphertext only — the encryption-first hard rule.
* **An unknown / dead target ephemeral drops, silently and safely.** The
  requester-restart case behind #648: the private half died with the
  process, so the pub is unknown. It must drop, must not raise, and must
  not be rescued by extending some other key's life.
* **Using an ephemeral does not extend its life.** The documented
  forward-secrecy bound is mint + TTL. Refreshing on use would have been
  a one-line "fix" for #648 and is deliberately rejected.
* **The origin's route-cache window closes before the target's key
  does.** If it can outlive the key, the origin keeps sealing under a
  private half the target already dropped — #648's mechanism.
"""

from __future__ import annotations

import time

import orjson
import pytest

from socialhome.federation import routed_crypto
from socialhome.federation.route_discovery import (
    ROUTE_CACHE_SAFETY_MARGIN_S,
    ROUTE_CACHE_TTL_S,
)

pytestmark = pytest.mark.security


ROUTE_ID = "route-0123456789abcdef"
INNER_EVENT = "space_post_created"


def _seal(payload: dict, *, target_pub: str) -> dict:
    """Seal ``payload`` as the origin would, for ``target_pub``."""
    origin_priv, origin_pub = routed_crypto.generate_ephemeral_keypair()
    return routed_crypto.seal_inner_payload(
        inner_payload_json=orjson.dumps(payload).decode(),
        origin_eph_priv_b64=origin_priv,
        origin_eph_pub_b64=origin_pub,
        target_eph_pub_b64=target_pub,
        route_id=ROUTE_ID,
        inner_event_type=INNER_EVENT,
    )


def test_relay_cannot_unseal_routed_space_content():
    """A non-member relay holds ciphertext only.

    CLAUDE.md hard rule: a household that isn't a space member but sits
    on the mesh between host and remote member is a routing relay and
    must not read any space content. The relay has its own X25519
    keypair; it must not decrypt with it, and the plaintext must not be
    recoverable from the sealed blob.
    """
    target_priv, target_pub = routed_crypto.generate_ephemeral_keypair()
    relay_priv, _relay_pub = routed_crypto.generate_ephemeral_keypair()

    secret = "sekrit-dinner-plans-2026"
    sealed = _seal({"body": secret, "post_id": "p1"}, target_pub=target_pub)

    # The relay's own key must not open it.
    with pytest.raises(Exception):
        routed_crypto.unseal_inner_payload(
            sealed=sealed,
            target_eph_priv_b64=relay_priv,
            route_id=ROUTE_ID,
            inner_event_type=INNER_EVENT,
        )

    # And the plaintext must not be sitting in the blob in any form.
    blob = repr(sealed)
    assert secret not in blob
    assert "dinner" not in blob

    # The intended target still opens it — the test is about the relay,
    # not about a broken seal.
    opened = routed_crypto.unseal_inner_payload(
        sealed=sealed,
        target_eph_priv_b64=target_priv,
        route_id=ROUTE_ID,
        inner_event_type=INNER_EVENT,
    )
    assert secret in opened


def test_seal_is_bound_to_route_id_and_inner_event_type():
    """AAD binding — a relay can't replay a sealed payload onto another
    route or relabel the inner event type it claims to carry."""
    target_priv, target_pub = routed_crypto.generate_ephemeral_keypair()
    sealed = _seal({"post_id": "p1"}, target_pub=target_pub)

    with pytest.raises(Exception):
        routed_crypto.unseal_inner_payload(
            sealed=sealed,
            target_eph_priv_b64=target_priv,
            route_id="route-a-different-one",
            inner_event_type=INNER_EVENT,
        )
    with pytest.raises(Exception):
        routed_crypto.unseal_inner_payload(
            sealed=sealed,
            target_eph_priv_b64=target_priv,
            route_id=ROUTE_ID,
            inner_event_type="space_member_left",
        )


def test_wrong_ephemeral_private_half_cannot_unseal():
    """The requester-restart case (#648).

    After a restart the target holds none of the ephemeral privates it
    minted before, so the pub the origin sealed under is unknown to it.
    A *different* private half must not open the blob — the recovery is
    re-discovery (which rotates the key), never a fallback that tries
    other keys.
    """
    _dead_priv, dead_pub = routed_crypto.generate_ephemeral_keypair()
    fresh_priv, _fresh_pub = routed_crypto.generate_ephemeral_keypair()

    sealed = _seal({"post_id": "p1"}, target_pub=dead_pub)

    with pytest.raises(Exception):
        routed_crypto.unseal_inner_payload(
            sealed=sealed,
            target_eph_priv_b64=fresh_priv,
            route_id=ROUTE_ID,
            inner_event_type=INNER_EVENT,
        )


def test_origin_route_cache_window_closes_before_target_key_expires():
    """The #648 ordering invariant, pinned as a release blocker.

    The origin seals under the ``target_eph_pk`` its route cache holds;
    the matching private half lives in the target's memory on its own
    timer. If the origin's window can outlive the target's, the origin
    keeps sealing under a dead key and the target discards every
    envelope in silence — no NACK exists, and the send already reported
    success.
    """
    assert ROUTE_CACHE_TTL_S < routed_crypto.DEFAULT_TARGET_EPH_TTL_S
    assert ROUTE_CACHE_SAFETY_MARGIN_S > 0
    assert (
        routed_crypto.DEFAULT_TARGET_EPH_TTL_S - ROUTE_CACHE_TTL_S
        == ROUTE_CACHE_SAFETY_MARGIN_S
    )


def test_target_ephemeral_ttl_is_not_extended_by_use():
    """Forward secrecy is bounded at mint + TTL, not last-use + TTL.

    Sliding the window forward on each successful unseal would have made
    #648's long-stream symptom disappear in one line, and is rejected on
    purpose: it converts "no forward secrecy beyond the discovery
    window" (``docs/crypto.md``) into "none while traffic flows". Forcing
    re-discovery rotates the ephemeral instead, which is the
    FS-*positive* direction.
    """
    from types import SimpleNamespace

    from socialhome.federation.route_discovery import RouteDiscoveryService

    svc = RouteDiscoveryService(
        federation_service=SimpleNamespace(own_instance_id="self"),  # type: ignore[arg-type]
        federation_repo=SimpleNamespace(),  # type: ignore[arg-type]
    )
    pub = svc._generate_target_eph(time.monotonic())
    _priv, expiry_at_mint = svc._target_eph_state[pub]

    for _ in range(5):
        assert svc.lookup_target_eph_priv(pub) is not None

    _priv2, expiry_after_use = svc._target_eph_state[pub]
    assert expiry_after_use == expiry_at_mint, (
        "repeated use extended the ephemeral's life — forward-secrecy bound lost"
    )

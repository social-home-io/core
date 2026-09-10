"""Admin route for the federation-compatibility panel.

Lists confirmed federation peers with the protocol version each advertises,
the features it lacks versus this build's :data:`OURS`, its last-reachable
timestamp, and whether it has ever advertised capabilities at all
(``capabilities_known`` — a NULL stamp distinguishes a genuine v1 peer from
one that's paired but still mid-first-handshake).

Routes:

* ``GET /api/admin/federation/compat``   (admin-only)
* ``POST /api/admin/federation/resync``  (admin-only) — ask a peer to
  re-broadcast state for a named scope (§319.6).
* ``GET / PUT /api/admin/federation/external-url`` (admin-only) — the
  admin-set federation inbox base URL. Until this existed, the only
  ways to supply it were ``socialhome.toml`` (operator-owned, not
  writable from the UI) or the Home Assistant integration — while the
  pairing error told admins to "set this Social Home\'s external URL in
  Settings", a field that did not exist anywhere in the SPA.
"""

from __future__ import annotations

import logging

from aiohttp import web

from ..app_keys import (
    db_key,
    federation_repo_key,
    federation_service_key,
    platform_adapter_key,
    url_update_outbound_key,
)
from ..platform.federation_base import (
    INBOX_PATH,
    MANUAL_BASE_KEY,
    read_manual_base,
)
from ..domain.federation import FederationEventType, PairingStatus
from ..domain.federation_capabilities import (
    OURS,
    FederationCapability,
    features_missing_below,
)
from ..security import error_response
from .base import BaseView

log = logging.getLogger(__name__)


class AdminFederationCompatView(BaseView):
    async def get(self) -> web.Response:
        if self.user is None or not self.user.is_admin:
            return error_response(403, "FORBIDDEN", "Admin only.")
        repo = self.svc(federation_repo_key)
        peers = await repo.list_instances(status=PairingStatus.CONFIRMED.value)
        return self._json(
            {
                "ours": OURS,
                "peers": [
                    {
                        "instance_id": p.id,
                        "display_name": p.effective_display_name,
                        "proto_version": p.proto_version,
                        "status": p.status.value,
                        "last_reachable_at": p.last_reachable_at,
                        "capabilities_known": p.capabilities_seen_at is not None,
                        "lacking_features": features_missing_below(p.proto_version),
                    }
                    for p in peers
                ],
            }
        )


def _valid_scope(scope: str) -> bool:
    """A resync scope is ``capabilities`` or ``space:<id>`` /
    ``calendar:<id>`` with a non-empty id."""
    if scope == "capabilities":
        return True
    for prefix in ("space:", "calendar:"):
        if scope.startswith(prefix):
            return bool(scope[len(prefix) :])
    return False


class AdminFederationResyncView(BaseView):
    """``POST /api/admin/federation/resync`` — ask a peer to re-broadcast.

    Sends :data:`FederationEventType.INSTANCE_RESYNC_REQUEST` to a
    confirmed peer for a named scope (``capabilities`` / ``space:<id>`` /
    ``calendar:<id>``). Gated on the peer advertising
    :data:`FederationCapability.MIN_FOR_INSTANCE_RESYNC` (v_19) — an older
    peer has no handler, so we 409 rather than fire into the void.
    """

    async def post(self) -> web.Response:
        if self.user is None or not self.user.is_admin:
            return error_response(403, "FORBIDDEN", "Admin only.")
        body = await self.body()
        instance_id = str(body.get("instance_id") or "")
        scope = str(body.get("scope") or "")
        if not instance_id or not _valid_scope(scope):
            return error_response(
                400,
                "UNPROCESSABLE",
                "instance_id is required and scope must be 'capabilities', "
                "'space:<id>', or 'calendar:<id>'.",
            )
        fed = self.svc(federation_service_key)
        if not await fed.peer_supports(
            instance_id,
            min_version=FederationCapability.MIN_FOR_INSTANCE_RESYNC,
        ):
            return error_response(
                409,
                "PEER_TOO_OLD",
                "That peer is on an older protocol version and can't honor "
                "a resync request yet.",
            )
        await fed.send_event(
            to_instance_id=instance_id,
            event_type=FederationEventType.INSTANCE_RESYNC_REQUEST,
            payload={"scope": scope},
        )
        return self._json({"status": "ok", "instance_id": instance_id, "scope": scope})


def _validate_base(raw: str) -> str | None:
    """Normalize + validate an admin-entered base URL.

    Returns the cleaned value, or ``None`` when it isn't a usable
    http(s) base. Same rules the HA integration's push endpoint applies,
    so both sources of this value are held to one standard. A trailing
    inbox path is tolerated and stripped, because pasting the full URL
    from a peer's pairing QR is the obvious mistake to make.
    """
    base = raw.strip().rstrip("/")
    if not base:
        return None
    if not (base.startswith("http://") or base.startswith("https://")):
        return None
    if base.endswith(INBOX_PATH):
        base = base[: -len(INBOX_PATH)].rstrip("/")
    # Reject a bare scheme ("https://") left over after stripping.
    if base in ("http:/", "https:/", "http://", "https://"):
        return None
    return base or None


class AdminFederationExternalUrlView(BaseView):
    """``GET / PUT /api/admin/federation/external-url`` (admin-only).

    The externally-reachable base peers POST federation envelopes to.
    ``PUT {"base": null}`` (or an empty string) clears it and hands
    control back to the deployment's automatic source — ``socialhome.toml``
    under standalone, the Home Assistant integration under ha/haos.

    GET reports the stored value alongside what the adapter would
    actually resolve, so an admin can tell "I typed something" apart from
    "it is in effect" — the two differ whenever an automatic source is
    also present.
    """

    async def get(self) -> web.Response:
        if self.user is None or not self.user.is_admin:
            return error_response(403, "FORBIDDEN", "Admin only.")
        db = self.svc(db_key)
        manual = await read_manual_base(db)
        effective: str | None = None
        try:
            effective = await self.svc(platform_adapter_key).get_federation_base()
        except Exception:  # pragma: no cover — a read must not 500
            effective = None
        return self._json(
            {
                "base": manual,
                "effective": effective,
                # Which source the resolved value came from, so the UI can
                # say so instead of leaving the admin to guess.
                "source": ("manual" if manual else ("auto" if effective else None)),
            }
        )

    async def put(self) -> web.Response:
        if self.user is None or not self.user.is_admin:
            return error_response(403, "FORBIDDEN", "Admin only.")
        body = await self.body()
        raw = body.get("base")
        db = self.svc(db_key)
        previous = await read_manual_base(db)

        if raw is None or not str(raw).strip():
            cleaned: str | None = None
        else:
            cleaned = _validate_base(str(raw))
            if cleaned is None:
                return error_response(
                    422,
                    "UNPROCESSABLE",
                    "base must be an http(s) URL, e.g. https://home.example.com",
                )

        if cleaned is None:
            await db.enqueue(
                "DELETE FROM instance_config WHERE key=?",
                (MANUAL_BASE_KEY,),
            )
        else:
            await db.enqueue(
                "INSERT INTO instance_config(key, value) VALUES(?,?)"
                " ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (MANUAL_BASE_KEY, cleaned),
            )

        changed = previous != cleaned
        notified = 0
        if changed:
            # Peers cache our inbox URL on their side; without this they
            # keep POSTing to the old address until they happen to re-pair.
            resolved: str | None = None
            try:
                resolved = await self.svc(
                    platform_adapter_key,
                ).get_federation_base()
            except Exception:  # pragma: no cover — defensive
                resolved = None
            if resolved:
                outbound = self.svc(url_update_outbound_key)
                try:
                    notified = await outbound.publish(
                        new_inbox_base_url=resolved,
                    )
                except Exception:  # pragma: no cover — defensive
                    log.exception(
                        "admin_federation: URL_UPDATED fan-out failed",
                    )

        return self._json(
            {
                "ok": True,
                "base": cleaned,
                "changed": changed,
                "peers_notified": notified,
            }
        )

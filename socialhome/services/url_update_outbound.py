"""Outbound federation for ``URL_UPDATED`` (§11).

When this instance's externally-reachable inbox URL changes — admin
rotates the ``external_url`` in standalone mode, Nabu Casa Remote UI
flips on/off in HA mode, etc. — we tell every confirmed peer so their
``remote_inbox_url`` tracks the move and future envelope deliveries
don't silently break.

The caller is responsible for detecting the change and invoking
:meth:`UrlUpdateOutbound.publish`. Typical wiring (PR 4): the HA
bridge hears ``federation.set_base`` from the integration, upserts
``instance_config['federation_base']``, and calls this service if the
stored value differs from the prior one.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from ..domain.federation import FederationEventType

if TYPE_CHECKING:
    from ..federation.federation_service import FederationService
    from ..repositories.federation_repo import AbstractFederationRepo

log = logging.getLogger(__name__)


class UrlUpdateOutbound:
    """Fan out ``URL_UPDATED`` to every confirmed peer."""

    __slots__ = ("_federation", "_federation_repo")

    def __init__(
        self,
        *,
        federation_service: "FederationService",
        federation_repo: "AbstractFederationRepo",
    ) -> None:
        self._federation = federation_service
        self._federation_repo = federation_repo

    async def publish(self, *, new_inbox_base_url: str) -> int:
        """Tell every confirmed peer about our new inbox URL.

        ``new_inbox_base_url`` is the scheme+host+path prefix — per-peer
        URLs are composed as ``f"{base}/{local_inbox_id}"`` so each peer
        gets its own secret path back.

        Returns the number of peers notified (best-effort count; failed
        sends are logged but do not raise).
        """
        base = new_inbox_base_url.rstrip("/")
        try:
            peers = await self._federation_repo.list_instances(status="confirmed")
        except Exception as exc:  # pragma: no cover — defensive
            log.debug("url-update-outbound: list peers failed: %s", exc)
            return 0
        own = getattr(self._federation, "_own_instance_id", "")
        sent = 0
        for peer in peers:
            instance_id = getattr(peer, "id", None)
            local_id = getattr(peer, "local_inbox_id", None)
            if not instance_id or instance_id == own or not local_id:
                continue
            peer_specific_url = f"{base}/{local_id}"
            try:
                await self._federation.send_event(
                    to_instance_id=instance_id,
                    event_type=FederationEventType.URL_UPDATED,
                    payload={"inbox_url": peer_specific_url},
                )
                sent += 1
            except Exception as exc:  # pragma: no cover — defensive
                log.debug(
                    "url-update-outbound: send to %s failed: %s",
                    instance_id,
                    exc,
                )
        log.info("url-update-outbound: notified %d peer(s) of new base %s", sent, base)
        return sent

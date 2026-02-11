"""
Intention: Append-only event log for all agent state mutations.
           Every meaningful action is logged before state changes.
           Enables full audit trail, state replay, and accountability.

Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Section 2.
         Implements "record 'why' not just 'what'" principle.

Author/Witness: Claude (Opus 4.5), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Immutable Ledger
"""

import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any, Callable
from threading import Lock

from ..schemas.event import AgentEvent, EventType, EventSource, EventLog


class EventLogService:
    """
    Append-only event log service.

    All state mutations MUST go through this service:
    1. Create event with context/reason
    2. Log event (appends to immutable store)
    3. Execute the actual state change

    The log can be replayed to reconstruct state.
    """

    def __init__(
        self,
        log_dir: Optional[str] = None,
        on_event: Optional[Callable[[AgentEvent], None]] = None
    ):
        """
        Initialize the event log.

        Args:
            log_dir: Directory to store log files (default: ./events/)
            on_event: Optional callback for each logged event
        """
        self.log_dir = Path(log_dir or "./events")
        self.log_dir.mkdir(parents=True, exist_ok=True)

        self.log_file = self.log_dir / "event_log.jsonl"
        self.sequence = self._load_sequence()
        self.last_event_hash: Optional[str] = None
        self.lock = Lock()
        self.on_event = on_event

        # Load last event hash for chaining
        self._load_last_hash()

    def _load_sequence(self) -> int:
        """Load the current sequence number from log."""
        if not self.log_file.exists():
            return 0
        count = 0
        with open(self.log_file, 'r') as f:
            for _ in f:
                count += 1
        return count

    def _load_last_hash(self):
        """Load the hash of the last event for chaining."""
        if not self.log_file.exists():
            return
        last_line = None
        with open(self.log_file, 'r') as f:
            for line in f:
                last_line = line
        if last_line:
            try:
                event_data = json.loads(last_line)
                event = AgentEvent(**event_data)
                self.last_event_hash = event.compute_hash()
            except Exception:
                pass

    def append(
        self,
        agent_id: str,
        action_type: EventType,
        author: str,
        payload: Optional[Dict[str, Any]] = None,
        context: str = "",
        reason: Optional[str] = None,
        author_type: EventSource = EventSource.AUTO,
        signature: str = "",
        resource_type: str = "agent",
        resource_id: Optional[str] = None,
        chain_tx_id: Optional[str] = None,
    ) -> AgentEvent:
        """
        Append an event to the log.

        This is the ONLY way to record events. Events are immutable once written.

        Args:
            agent_id: The agent this event relates to
            action_type: What happened
            author: Who/what created this event (pubkey or system ID)
            payload: Event-specific data
            context: Human-readable explanation of why this happened
            reason: Structured reason code
            author_type: Source type (manual, auto, chain, agent)
            signature: Author's signature of event
            resource_type: Type of resource affected
            resource_id: Specific resource ID if not agent
            chain_tx_id: On-chain transaction ID if applicable

        Returns:
            The created AgentEvent
        """
        with self.lock:
            self.sequence += 1

            event = AgentEvent(
                event_id=str(uuid.uuid4()),
                sequence=self.sequence,
                agent_id=agent_id,
                resource_type=resource_type,
                resource_id=resource_id,
                action_type=action_type,
                payload=payload or {},
                author=author,
                author_type=author_type,
                context=context,
                reason=reason,
                signature=signature,
                previous_event_hash=self.last_event_hash,
                timestamp=datetime.utcnow(),
                chain_tx_id=chain_tx_id,
            )

            # Compute and store resource hash
            event.resource_hash = event.compute_hash()

            # Write to log file (append-only)
            with open(self.log_file, 'a') as f:
                f.write(json.dumps(event.dict(), default=str) + "\n")

            # Update chain
            self.last_event_hash = event.compute_hash()

            # Trigger callback if set
            if self.on_event:
                self.on_event(event)

            return event

    def query(
        self,
        agent_id: Optional[str] = None,
        action_type: Optional[EventType] = None,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AgentEvent]:
        """
        Query events from the log.

        Args:
            agent_id: Filter by agent
            action_type: Filter by action type
            since: Events after this timestamp
            until: Events before this timestamp
            limit: Max events to return
            offset: Skip this many events

        Returns:
            List of matching events
        """
        events = []

        if not self.log_file.exists():
            return events

        with open(self.log_file, 'r') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    event = AgentEvent(**data)

                    # Apply filters
                    if agent_id and event.agent_id != agent_id:
                        continue
                    if action_type and event.action_type != action_type:
                        continue
                    if since and event.timestamp < since:
                        continue
                    if until and event.timestamp > until:
                        continue

                    events.append(event)
                except Exception:
                    continue

        # Apply offset and limit
        return events[offset:offset + limit]

    def get_agent_history(self, agent_id: str) -> List[AgentEvent]:
        """Get all events for a specific agent."""
        return self.query(agent_id=agent_id, limit=10000)

    def get_latest(self, count: int = 10) -> List[AgentEvent]:
        """Get the most recent events."""
        events = self.query(limit=count + 100)  # Over-fetch to handle limit
        return events[-count:] if len(events) > count else events

    def export(
        self,
        agent_id: Optional[str] = None,
        since: Optional[datetime] = None,
    ) -> EventLog:
        """
        Export events as an EventLog for sync/backup.

        Args:
            agent_id: Optional filter to single agent
            since: Optional start timestamp

        Returns:
            EventLog container with events and metadata
        """
        events = self.query(agent_id=agent_id, since=since, limit=100000)

        log = EventLog(
            events=events,
            start_sequence=events[0].sequence if events else 0,
            end_sequence=events[-1].sequence if events else 0,
            agent_filter=agent_id,
        )
        log.checksum = log.compute_checksum()

        return log

    def verify_chain(self) -> bool:
        """
        Verify the integrity of the event chain.

        Returns:
            True if all events properly chain together
        """
        events = self.query(limit=100000)
        if not events:
            return True

        prev_hash = None
        for event in events:
            if event.previous_event_hash != prev_hash:
                return False
            prev_hash = event.compute_hash()

        return True


# Global instance for convenience
_event_log: Optional[EventLogService] = None


def get_event_log(log_dir: Optional[str] = None) -> EventLogService:
    """Get or create the global event log instance."""
    global _event_log
    if _event_log is None:
        _event_log = EventLogService(log_dir=log_dir)
    return _event_log


def log_event(
    agent_id: str,
    action_type: EventType,
    author: str,
    context: str = "",
    **kwargs
) -> AgentEvent:
    """
    Convenience function to log an event.

    Usage:
        from shared.utils.event_log import log_event, EventType

        log_event(
            agent_id="abc-123",
            action_type=EventType.MEMORY_CREATED,
            author="system",
            context="Agent created first memory",
            payload={"memory_id": "mem-456"}
        )
    """
    return get_event_log().append(
        agent_id=agent_id,
        action_type=action_type,
        author=author,
        context=context,
        **kwargs
    )

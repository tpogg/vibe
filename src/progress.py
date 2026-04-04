"""Progress event system — streams pipeline status to the web UI via SSE."""

import asyncio
import time
from dataclasses import dataclass, field
from enum import Enum


class EventType(Enum):
    # Pipeline stages
    PIPELINE_START = "pipeline_start"
    PIPELINE_DONE = "pipeline_done"
    PIPELINE_ERROR = "pipeline_error"

    # Scraping
    SCRAPE_START = "scrape_start"
    SCRAPE_CHANNEL_START = "scrape_channel_start"
    SCRAPE_CHANNEL_DONE = "scrape_channel_done"
    SCRAPE_FILE = "scrape_file"
    SCRAPE_DONE = "scrape_done"

    # Categorizing
    CATEGORIZE_START = "categorize_start"
    CATEGORIZE_FILE = "categorize_file"
    CATEGORIZE_DONE = "categorize_done"

    # Uploading
    UPLOAD_START = "upload_start"
    UPLOAD_FILE = "upload_file"
    UPLOAD_DONE = "upload_done"

    # General
    LOG = "log"


@dataclass
class ProgressEvent:
    type: EventType
    message: str
    data: dict = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_sse(self) -> str:
        import json
        payload = {
            "type": self.type.value,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        return f"data: {json.dumps(payload)}\n\n"


class ProgressTracker:
    """Manages progress events and broadcasts to SSE subscribers."""

    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []
        self._history: list[ProgressEvent] = []
        self.is_running = False

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        # Send history to new subscriber
        for event in self._history:
            q.put_nowait(event)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    def emit(self, event_type: EventType, message: str, **data):
        event = ProgressEvent(type=event_type, message=message, data=data)
        self._history.append(event)
        # Keep history bounded
        if len(self._history) > 500:
            self._history = self._history[-300:]
        for q in self._subscribers:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass

    def clear(self):
        self._history.clear()


# Global instance
progress = ProgressTracker()

import { randomUUID } from 'node:crypto';

const clients = new Set();

function normaliseFilters(filters = {}) {
  const zoneIds = Array.isArray(filters.zoneIds)
    ? filters.zoneIds.filter(Boolean)
    : filters.zoneId
      ? [filters.zoneId]
      : [];

  return {
    zoneIds: new Set(zoneIds),
    includeOutOfZone: Boolean(filters.includeOutOfZone),
    outOfZoneOnly: Boolean(filters.outOfZoneOnly)
  };
}

function matchesFilters(client, meta) {
  if (!meta) {
    return true;
  }

  const { zoneId = null, allowOutOfZone = false } = meta;
  const { zoneIds, includeOutOfZone, outOfZoneOnly } = client.filters;

  if (outOfZoneOnly) {
    return Boolean(allowOutOfZone);
  }

  if (zoneIds.size === 0) {
    if (!includeOutOfZone && allowOutOfZone) {
      return true;
    }
    return true;
  }

  if (zoneId && zoneIds.has(zoneId)) {
    return true;
  }

  if (allowOutOfZone && includeOutOfZone) {
    return true;
  }

  return false;
}

function serialiseEvent(eventName, payload) {
  const data = payload === undefined ? '{}' : JSON.stringify(payload);
  return `event: ${eventName}\ndata: ${data}\n\n`;
}

export function registerLiveFeedClient(res, filters = {}) {
  const client = {
    id: randomUUID(),
    res,
    filters: normaliseFilters(filters),
    closed: false,
    send(eventName, payload, meta = null) {
      if (this.closed || !matchesFilters(this, meta)) {
        return;
      }
      try {
        this.res.write(serialiseEvent(eventName, payload));
      } catch {
        this.closed = true;
        clients.delete(this);
      }
    },
    close() {
      this.closed = true;
      clients.delete(this);
    }
  };

  clients.add(client);
  return client;
}

export function removeLiveFeedClient(client) {
  if (!client) {
    return;
  }
  client.close();
}

export function broadcastLiveFeedEvent(eventName, payload = {}) {
  const meta = {
    zoneId: payload.zoneId ?? payload.post?.zoneId ?? null,
    allowOutOfZone: payload.allowOutOfZone ?? payload.post?.allowOutOfZone ?? false
  };

  for (const client of clients) {
    client.send(eventName, payload, meta);
  }
}

export function activeLiveFeedConnections() {
  return clients.size;
}

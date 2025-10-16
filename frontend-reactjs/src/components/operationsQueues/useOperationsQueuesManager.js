import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchOperationsQueues,
  createOperationsQueue,
  updateOperationsQueue,
  archiveOperationsQueue,
  createOperationsQueueUpdate,
  updateOperationsQueueUpdate,
  deleteOperationsQueueUpdate,
  prepareQueueMetadataForSubmit
} from '../../api/operationsQueueClient.js';
import { DEFAULT_CAPABILITIES } from './constants.js';

function normaliseCapabilities(capabilities) {
  if (!capabilities || typeof capabilities !== 'object') {
    return { ...DEFAULT_CAPABILITIES };
  }
  return {
    ...DEFAULT_CAPABILITIES,
    canCreate: Boolean(capabilities.canCreate),
    canEdit: Boolean(capabilities.canEdit),
    canArchive: Boolean(capabilities.canArchive),
    canManageUpdates: Boolean(capabilities.canManageUpdates)
  };
}

function toBoardPayload(form) {
  const payload = {
    title: form.title?.trim(),
    owner: form.owner?.trim(),
    summary: form.summary?.trim(),
    status: form.status,
    priority: Number.parseInt(form.priority, 10) || 3,
    metadata: prepareQueueMetadataForSubmit({
      ...form.metadata,
      tags: form.metadata.tags?.map((value) => value.trim()),
      watchers: form.metadata.watchers?.map((value) => value.trim()),
      intakeChannels: form.metadata.intakeChannels?.map((value) => value.trim())
    })
  };
  if (payload.metadata.slaMinutes === null) {
    payload.metadata.slaMinutes = null;
  }
  return payload;
}

function toUpdatePayload(form) {
  return {
    headline: form.headline?.trim(),
    body: form.body?.trim(),
    tone: form.tone,
    recordedAt: form.recordedAt || null,
    attachments: Array.isArray(form.attachments)
      ? form.attachments
          .map((attachment) => ({
            label: attachment.label?.trim() || undefined,
            url: attachment.url?.trim() || undefined,
            type: attachment.type?.trim() || undefined
          }))
          .filter((attachment) => attachment.url)
      : []
  };
}

export function useOperationsQueuesManager(initialBoards = [], initialCapabilities = null) {
  const [boards, setBoards] = useState(initialBoards);
  const [capabilities, setCapabilities] = useState(normaliseCapabilities(initialCapabilities));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState(initialBoards[0]?.id ?? null);

  useEffect(() => {
    setBoards(initialBoards);
    setSelectedBoardId((current) => {
      if (current && initialBoards.some((board) => board.id === current)) {
        return current;
      }
      return initialBoards[0]?.id ?? null;
    });
  }, [initialBoards]);

  useEffect(() => {
    setCapabilities(normaliseCapabilities(initialCapabilities));
  }, [initialCapabilities]);

  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId) ?? null,
    [boards, selectedBoardId]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchOperationsQueues();
      setBoards(payload.boards ?? []);
      setCapabilities(normaliseCapabilities(payload.capabilities));
      if (payload.boards?.length) {
        setSelectedBoardId((current) => {
          if (current && payload.boards.some((board) => board.id === current)) {
            return current;
          }
          return payload.boards[0].id;
        });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to refresh operations queues'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoard = useCallback(async (form) => {
    const payload = toBoardPayload(form);
    const board = await createOperationsQueue(payload);
    setBoards((current) => [board, ...current]);
    setSelectedBoardId(board.id);
    return board;
  }, []);

  const updateBoard = useCallback(async (id, form) => {
    const payload = toBoardPayload(form);
    const board = await updateOperationsQueue(id, payload);
    setBoards((current) => current.map((item) => (item.id === board.id ? board : item)));
    return board;
  }, []);

  const archiveBoard = useCallback(async (id) => {
    await archiveOperationsQueue(id);
    setBoards((current) => current.filter((item) => item.id !== id));
    setSelectedBoardId((current) => {
      if (current === id) {
        return null;
      }
      return current;
    });
  }, []);

  const createUpdate = useCallback(async (boardId, form) => {
    const payload = toUpdatePayload(form);
    const update = await createOperationsQueueUpdate(boardId, payload);
    setBoards((current) =>
      current.map((board) => (board.id === boardId ? { ...board, updates: [update, ...(board.updates ?? [])] } : board))
    );
    return update;
  }, []);

  const updateUpdate = useCallback(async (boardId, updateId, form) => {
    const payload = toUpdatePayload(form);
    const update = await updateOperationsQueueUpdate(boardId, updateId, payload);
    setBoards((current) =>
      current.map((board) =>
        board.id === boardId
          ? {
              ...board,
              updates: (board.updates ?? []).map((item) => (item.id === update.id ? { ...item, ...update } : item))
            }
          : board
      )
    );
    return update;
  }, []);

  const deleteUpdate = useCallback(async (boardId, updateId) => {
    await deleteOperationsQueueUpdate(boardId, updateId);
    setBoards((current) =>
      current.map((board) =>
        board.id === boardId
          ? { ...board, updates: (board.updates ?? []).filter((item) => item.id !== updateId) }
          : board
      )
    );
  }, []);

  return {
    boards,
    capabilities,
    loading,
    error,
    selectedBoardId,
    selectedBoard,
    setSelectedBoardId,
    refresh,
    createBoard,
    updateBoard,
    archiveBoard,
    createUpdate,
    updateUpdate,
    deleteUpdate
  };
}

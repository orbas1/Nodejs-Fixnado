import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Spinner } from '../ui/index.js';
import { DEFAULT_CAPABILITIES } from './constants.js';
import { defaultBoardForm, defaultUpdateForm, mapBoardToForm, mapUpdateToForm } from './formUtils.js';
import { useOperationsQueuesManager } from './useOperationsQueuesManager.js';
import QueueBoardList from './QueueBoardList.jsx';
import QueueBoardForm from './QueueBoardForm.jsx';
import QueueUpdateForm from './QueueUpdateForm.jsx';
import QueueDetailDrawer from './QueueDetailDrawer.jsx';

function WorkspaceDialog({
  open,
  onClose,
  boards,
  selectedBoard,
  selectedBoardId,
  setSelectedBoardId,
  capabilities,
  loading,
  error,
  onRefresh,
  boardForm,
  onBoardChange,
  onBoardSubmit,
  onArchive,
  savingBoard,
  deletingBoard,
  showCreate,
  onCreateToggle,
  newBoardForm,
  onNewBoardChange,
  onCreateBoard,
  updates,
  onEditUpdate,
  onDeleteUpdate,
  onStartCreateUpdate
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-10 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-6 opacity-0"
            >
              <Dialog.Panel className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-accent/10 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-accent/10 p-6">
                  <div>
                    <Dialog.Title className="text-2xl font-semibold text-primary">Operations workspace</Dialog.Title>
                    <p className="mt-2 text-sm text-slate-600">
                      Review queues, manage metadata, and publish updates from this unified workspace.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" icon={ArrowPathIcon} iconPosition="start" onClick={onRefresh}>
                      Refresh data
                    </Button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-accent/20 bg-white p-2 text-slate-500 hover:border-accent hover:text-accent"
                      aria-label="Close workspace"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[320px_1fr]">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Queues</h3>
                      {capabilities.canCreate ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={PlusIcon}
                          iconPosition="start"
                          onClick={onCreateToggle}
                        >
                          {showCreate ? 'Close form' : 'New queue'}
                        </Button>
                      ) : null}
                    </div>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-2xl border border-accent/10 bg-secondary/30 p-3">
                      {boards.length ? (
                        boards.map((board) => (
                          <button
                            key={board.id}
                            type="button"
                            onClick={() => setSelectedBoardId(board.id)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              board.id === selectedBoardId
                                ? 'border-accent bg-white text-primary shadow-sm'
                                : 'border-transparent bg-white/80 text-slate-600 hover:border-accent/40 hover:text-primary'
                            }`}
                          >
                            <p className="font-semibold">{board.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Owner: {board.owner}</p>
                          </button>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-accent/30 bg-white/70 p-4 text-sm text-slate-600">
                          No queues yet — create one to start orchestrating operations.
                        </p>
                      )}
                    </div>
                    {error ? (
                      <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p>
                    ) : null}
                    {loading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Spinner size="sm" /> Loading latest queues…
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-6">
                    {showCreate ? (
                      <div className="rounded-3xl border border-accent/10 bg-secondary/30 p-6">
                        <QueueBoardForm
                          mode="create"
                          form={newBoardForm}
                          onChange={onNewBoardChange}
                          onSubmit={onCreateBoard}
                          onClose={onCreateToggle}
                          capabilities={capabilities}
                          saving={savingBoard}
                        />
                      </div>
                    ) : null}
                    {selectedBoard ? (
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-3xl border border-accent/10 bg-secondary/30 p-6">
                          <QueueBoardForm
                            mode="edit"
                            form={boardForm}
                            onChange={onBoardChange}
                            onSubmit={onBoardSubmit}
                            onClose={onClose}
                            onArchive={onArchive}
                            capabilities={capabilities}
                            saving={savingBoard}
                            deleting={deletingBoard}
                          />
                        </div>
                        <div className="rounded-3xl border border-accent/10 bg-secondary/30 p-6">
                          <h3 className="text-lg font-semibold text-primary">Updates</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Manage incident, verification, and automation updates for this queue.
                          </p>
                          <div className="mt-4 space-y-3">
                            {updates.length ? (
                              updates.map((update) => (
                                <article key={update.id} className="rounded-2xl border border-accent/10 bg-white p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-primary">{update.headline}</p>
                                      <p className="mt-1 text-xs text-slate-500">{new Date(update.recordedAt ?? Date.now()).toLocaleString()}</p>
                                    </div>
                                    {capabilities.canManageUpdates ? (
                                      <div className="flex gap-2">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => onEditUpdate(update)}>
                                          Edit
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => onDeleteUpdate(update)}>
                                          Delete
                                        </Button>
                                      </div>
                                    ) : null}
                                  </div>
                                  {update.body ? <p className="mt-2 text-xs text-slate-600">{update.body}</p> : null}
                                </article>
                              ))
                            ) : (
                              <p className="rounded-2xl border border-dashed border-accent/30 bg-white/70 p-4 text-sm text-slate-600">
                                No updates recorded yet.
                              </p>
                            )}
                          </div>
                          {capabilities.canManageUpdates ? (
                            <Button type="button" variant="secondary" icon={PlusIcon} iconPosition="start" className="mt-4" onClick={onStartCreateUpdate}>
                              Log update
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : boards.length && !showCreate ? (
                      <p className="rounded-3xl border border-accent/10 bg-secondary/30 p-6 text-sm text-slate-600">
                        Select a queue from the left to edit metadata and updates.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

WorkspaceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  boards: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedBoard: PropTypes.object,
  selectedBoardId: PropTypes.string,
  setSelectedBoardId: PropTypes.func.isRequired,
  capabilities: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onRefresh: PropTypes.func.isRequired,
  boardForm: PropTypes.object.isRequired,
  onBoardChange: PropTypes.func.isRequired,
  onBoardSubmit: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
  savingBoard: PropTypes.bool,
  deletingBoard: PropTypes.bool,
  showCreate: PropTypes.bool,
  onCreateToggle: PropTypes.func.isRequired,
  newBoardForm: PropTypes.object.isRequired,
  onNewBoardChange: PropTypes.func.isRequired,
  onCreateBoard: PropTypes.func.isRequired,
  updates: PropTypes.arrayOf(PropTypes.object),
  onEditUpdate: PropTypes.func.isRequired,
  onDeleteUpdate: PropTypes.func.isRequired,
  onStartCreateUpdate: PropTypes.func.isRequired
};

WorkspaceDialog.defaultProps = {
  selectedBoard: null,
  selectedBoardId: null,
  capabilities: DEFAULT_CAPABILITIES,
  loading: false,
  error: null,
  onArchive: undefined,
  savingBoard: false,
  deletingBoard: false,
  showCreate: false,
  updates: []
};

export default function OperationsQueuesSection({ section }) {
  const initialBoards = useMemo(() => section?.data?.boards ?? [], [section]);
  const initialCapabilities = useMemo(() => section?.data?.capabilities ?? DEFAULT_CAPABILITIES, [section]);
  const {
    boards,
    capabilities,
    loading,
    error,
    selectedBoard,
    selectedBoardId,
    setSelectedBoardId,
    refresh,
    createBoard,
    updateBoard,
    archiveBoard,
    createUpdate,
    updateUpdate,
    deleteUpdate
  } = useOperationsQueuesManager(initialBoards, initialCapabilities);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [detailBoardId, setDetailBoardId] = useState(null);
  const [boardForm, setBoardForm] = useState(() => mapBoardToForm(selectedBoard));
  const [newBoardForm, setNewBoardForm] = useState(defaultBoardForm());
  const [savingBoard, setSavingBoard] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [updateDraft, setUpdateDraft] = useState(defaultUpdateForm());
  const [updateMode, setUpdateMode] = useState('create');
  const [savingUpdate, setSavingUpdate] = useState(false);

  useEffect(() => {
    setBoardForm(mapBoardToForm(selectedBoard));
  }, [selectedBoard]);

  useEffect(() => {
    setUpdateDraft(defaultUpdateForm());
    setUpdateMode('create');
  }, [selectedBoardId]);

  useEffect(() => {
    if (workspaceOpen) {
      refresh();
    }
  }, [workspaceOpen, refresh]);

  useEffect(() => {
    if (workspaceOpen && !boards.length && capabilities.canCreate) {
      setShowCreate(true);
    }
  }, [workspaceOpen, boards.length, capabilities.canCreate]);

  const handleBoardSubmit = useCallback(async () => {
    if (!selectedBoard) return;
    setSavingBoard(true);
    try {
      await updateBoard(selectedBoard.id, boardForm);
    } finally {
      setSavingBoard(false);
    }
  }, [selectedBoard, updateBoard, boardForm]);

  const handleCreateBoard = useCallback(async () => {
    setSavingBoard(true);
    try {
      const created = await createBoard(newBoardForm);
      setNewBoardForm(defaultBoardForm());
      setShowCreate(false);
      setSelectedBoardId(created.id);
    } finally {
      setSavingBoard(false);
    }
  }, [createBoard, newBoardForm, setSelectedBoardId]);

  const handleArchive = useCallback(async () => {
    if (!selectedBoard) return;
    setDeletingBoard(true);
    try {
      await archiveBoard(selectedBoard.id);
    } finally {
      setDeletingBoard(false);
    }
  }, [selectedBoard, archiveBoard]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleEditUpdate = useCallback(
    (update) => {
      setUpdateDraft(mapUpdateToForm(update));
      setUpdateMode('edit');
    },
    []
  );

  const handleStartCreateUpdate = useCallback(() => {
    setUpdateDraft(defaultUpdateForm());
    setUpdateMode('create');
  }, []);

  const handleDeleteUpdate = useCallback(
    async (update) => {
      if (!selectedBoard) return;
      await deleteUpdate(selectedBoard.id, update.id);
    },
    [deleteUpdate, selectedBoard]
  );

  const handleSubmitUpdate = useCallback(async () => {
    if (!selectedBoard) return;
    setSavingUpdate(true);
    try {
      if (updateMode === 'edit' && updateDraft.id) {
        await updateUpdate(selectedBoard.id, updateDraft.id, updateDraft);
      } else {
        await createUpdate(selectedBoard.id, updateDraft);
      }
      setUpdateDraft(defaultUpdateForm());
      setUpdateMode('create');
    } finally {
      setSavingUpdate(false);
    }
  }, [selectedBoard, updateMode, updateDraft, createUpdate, updateUpdate]);

  const activeBoardForDetail = useMemo(
    () => boards.find((board) => board.id === detailBoardId) ?? null,
    [boards, detailBoardId]
  );

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
        <p className="text-sm text-slate-600">{section.description}</p>
      </header>

      <QueueBoardList
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelect={setSelectedBoardId}
        onViewDetail={(boardId) => setDetailBoardId(boardId)}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" icon={PlusIcon} iconPosition="start" onClick={() => setWorkspaceOpen(true)}>
          Open operations workspace
        </Button>
        <Button type="button" variant="ghost" icon={ArrowPathIcon} iconPosition="start" onClick={handleRefresh}>
          Refresh queues
        </Button>
      </div>

      {selectedBoard ? (
        <div className="rounded-3xl border border-accent/10 bg-white/80 p-6 shadow-sm">
          <QueueUpdateForm
            mode={updateMode}
            form={updateDraft}
            onChange={setUpdateDraft}
            onSubmit={handleSubmitUpdate}
            saving={savingUpdate}
            onCancel={() => {
              setUpdateDraft(defaultUpdateForm());
              setUpdateMode('create');
            }}
          />
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-accent/30 bg-secondary/40 p-6 text-sm text-slate-600">
          Select a queue to log updates and attach runbooks.
        </p>
      )}

      <WorkspaceDialog
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        boards={boards}
        selectedBoard={selectedBoard}
        selectedBoardId={selectedBoardId}
        setSelectedBoardId={setSelectedBoardId}
        capabilities={capabilities}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        boardForm={boardForm}
        onBoardChange={setBoardForm}
        onBoardSubmit={handleBoardSubmit}
        onArchive={capabilities.canArchive ? handleArchive : undefined}
        savingBoard={savingBoard}
        deletingBoard={deletingBoard}
        showCreate={showCreate}
        onCreateToggle={() => setShowCreate((state) => !state)}
        newBoardForm={newBoardForm}
        onNewBoardChange={setNewBoardForm}
        onCreateBoard={handleCreateBoard}
        updates={selectedBoard?.updates ?? []}
        onEditUpdate={handleEditUpdate}
        onDeleteUpdate={handleDeleteUpdate}
        onStartCreateUpdate={handleStartCreateUpdate}
      />

      <QueueDetailDrawer board={activeBoardForDetail} open={Boolean(detailBoardId)} onClose={() => setDetailBoardId(null)} />
    </section>
  );
}

OperationsQueuesSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      boards: PropTypes.arrayOf(PropTypes.object),
      capabilities: PropTypes.object
    })
  }).isRequired
};

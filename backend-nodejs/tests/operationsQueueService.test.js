import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { sequelize, OperationsQueueBoard, OperationsQueueUpdate } = await import('../src/models/index.js');
const {
  listQueueBoards,
  createQueueBoard,
  updateQueueBoard,
  createQueueUpdate,
  updateQueueUpdate,
  deleteQueueUpdate
} = await import('../src/services/operationsQueueService.js');

describe('operationsQueueService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await OperationsQueueUpdate.destroy({ where: {}, truncate: true });
    await OperationsQueueBoard.destroy({ where: {}, truncate: true });
  });

  it('creates, lists, updates, and archives queue boards with updates', async () => {
    const board = await createQueueBoard(
      {
        title: 'Escalation triage',
        summary: 'Monitor high-priority disputes and route to on-call leads.',
        owner: 'Support Control',
        status: 'attention',
        priority: 1,
        metadata: {
          tags: ['Disputes', 'Finance'],
          watchers: ['ops-duty@fixnado.example', 'OPS-DUTY@fixnado.example'],
          intakeChannels: ['Ticket escalation'],
          slaMinutes: 90,
          escalationContact: 'support-manager@fixnado.example',
          playbookUrl: 'https://runbooks.fixnado.example/escalation-triage',
          autoAlerts: false,
          notes: 'Runbook requires finance visibility.'
        }
      },
      { actor: { actorId: 'actor-1' } }
    );

    expect(board.title).toBe('Escalation triage');
    expect(board.slug).toBeDefined();
    expect(board.metadata.tags).toEqual(['Disputes', 'Finance']);
    expect(board.metadata.watchers).toEqual(['ops-duty@fixnado.example']);
    expect(board.metadata.intakeChannels).toEqual(['Ticket escalation']);
    expect(board.metadata.slaMinutes).toBe(90);
    expect(board.metadata.autoAlerts).toBe(false);

    const update = await createQueueUpdate(board.id, {
      headline: 'Three escalations resolved',
      body: 'Stage-two disputes cleared within SLA.',
      tone: 'success'
    });

    expect(update.headline).toContain('Three escalations');

    await updateQueueBoard(
      board.id,
      { owner: 'Support Ops', metadata: { watchers: ['triage@fixnado.example'], autoAlerts: true } },
      { actor: { actorId: 'actor-2' } }
    );

    const boards = await listQueueBoards({ includeUpdates: true });
    expect(boards).toHaveLength(1);
    expect(boards[0].updates).toHaveLength(1);
    expect(boards[0].owner).toBe('Support Ops');
    expect(boards[0].metadata.watchers).toEqual(['triage@fixnado.example']);
    expect(boards[0].metadata.autoAlerts).toBe(true);

    const refreshedUpdate = await updateQueueUpdate(board.id, update.id, {
      body: 'Stage-two disputes cleared within SLA and reported to finance.'
    });

    expect(refreshedUpdate.body).toContain('finance');

    await deleteQueueUpdate(board.id, update.id, { actor: { actorId: 'actor-3' } });
    const afterDeletion = await listQueueBoards({ includeUpdates: true });
    expect(afterDeletion[0].updates).toHaveLength(0);
  });
});

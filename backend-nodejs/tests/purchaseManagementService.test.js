import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const {
  sequelize,
  User
} = await import('../src/models/index.js');

const {
  listPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  recordPurchaseReceipt,
  addPurchaseAttachment,
  removePurchaseAttachment,
  listSuppliers,
  upsertSupplier,
  updateSupplierStatus,
  listPurchaseBudgets,
  upsertPurchaseBudget
} = await import('../src/services/purchaseManagementService.js');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

function buildActor() {
  return User.create(
    {
      firstName: 'Ops',
      lastName: 'Admin',
      email: `ops-admin-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'operations_admin'
    },
    { validate: false }
  );
}

describe('purchaseManagementService', () => {
  it('creates and lists purchase orders with computed totals', async () => {
    const actor = await buildActor();
    const supplier = await upsertSupplier({
      payload: {
        name: 'Acme Supplies',
        contactEmail: 'purchasing@acme.test'
      },
      actorId: actor.id
    });

    const order = await createPurchaseOrder({
      actorId: actor.id,
      payload: {
        supplierId: supplier.id,
        currency: 'gbp',
        expectedAt: new Date().toISOString(),
        items: [
          { itemName: 'Generator', quantity: 2, unitCost: 1500, taxRate: 20 },
          { itemName: 'Extension cable', quantity: 10, unitCost: 45.5, taxRate: 5 }
        ],
        notes: 'Urgent restock'
      }
    });

    expect(order.reference).toMatch(/^PO-/);
    expect(order.supplierName).toBe('Acme Supplies');
    expect(order.items).toHaveLength(2);
    expect(order.subtotal).toBeCloseTo(2 * 1500 + 10 * 45.5, 2);
    expect(order.total).toBeGreaterThan(order.subtotal);

    const { total, orders } = await listPurchaseOrders();
    expect(total).toBe(1);
    expect(orders[0].supplierName).toBe('Acme Supplies');

    const fetched = await getPurchaseOrderById(order.id);
    expect(fetched.items.map((item) => item.itemName)).toContain('Generator');
  });

  it('updates orders, records receipts, and manages attachments', async () => {
    const actor = await buildActor();
    const supplier = await upsertSupplier({ payload: { name: 'Beta Tools' }, actorId: actor.id });
    const order = await createPurchaseOrder({
      actorId: actor.id,
      payload: {
        supplierId: supplier.id,
        currency: 'USD',
        items: [
          { itemName: 'Impact drill', quantity: 4, unitCost: 220, taxRate: 20 }
        ]
      }
    });

    const updated = await updatePurchaseOrder({
      orderId: order.id,
      actorId: actor.id,
      payload: {
        supplierId: supplier.id,
        currency: 'USD',
        items: [
          { id: order.items[0].id, itemName: 'Impact drill', quantity: 4, unitCost: 220, taxRate: 20 },
          { itemName: 'Safety goggles', quantity: 8, unitCost: 18.75, taxRate: 0 }
        ],
        notes: 'Include PPE'
      }
    });

    expect(updated.items).toHaveLength(2);
    expect(updated.notes).toContain('Include PPE');

    const status = await updatePurchaseOrderStatus({
      orderId: updated.id,
      nextStatus: 'approved',
      actorId: actor.id
    });
    expect(status.status).toBe('approved');
    expect(status.approvedAt).toBeTruthy();

    const attachment = await addPurchaseAttachment({
      orderId: updated.id,
      payload: {
        fileName: 'quote.pdf',
        fileUrl: 'https://files.example.test/quote.pdf',
        category: 'quote'
      },
      actorId: actor.id
    });
    expect(attachment.fileName).toBe('quote.pdf');

    const receipt = await recordPurchaseReceipt({
      orderId: updated.id,
      actorId: actor.id,
      note: 'Delivered complete',
      items: updated.items.map((item) => ({ id: item.id, receivedQuantity: item.quantity }))
    });
    expect(receipt.status).toBe('received');
    expect(receipt.notes).toContain('Receiving');

    await removePurchaseAttachment({ orderId: updated.id, attachmentId: attachment.id });
    const withAttachments = await getPurchaseOrderById(updated.id);
    expect(withAttachments.attachments).toHaveLength(0);
  });

  it('manages supplier status transitions and budget rollups', async () => {
    const actor = await buildActor();

    const supplier = await upsertSupplier({
      payload: { name: 'Gamma Logistics', status: 'inactive', tags: ['logistics', 'freight'] },
      actorId: actor.id
    });
    expect(supplier.status).toBe('inactive');

    const activated = await updateSupplierStatus({ supplierId: supplier.id, status: 'active' });
    expect(activated.status).toBe('active');

    const suppliers = await listSuppliers({ status: 'active' });
    expect(suppliers).toHaveLength(1);

    const onHold = await updateSupplierStatus({ supplierId: supplier.id, status: 'on_hold' });
    expect(onHold.status).toBe('on_hold');

    const onHoldSuppliers = await listSuppliers({ status: 'on_hold' });
    expect(onHoldSuppliers.some((entry) => entry.id === supplier.id)).toBe(true);

    const budget = await upsertPurchaseBudget({
      actorId: actor.id,
      payload: {
        category: 'Capital Projects',
        fiscalYear: 2025,
        allocated: 50000,
        spent: 12000,
        committed: 8000,
        currency: 'gbp'
      }
    });

    expect(budget.allocated).toBe(50000);
    expect(budget.currency).toBe('GBP');

    const budgets = await listPurchaseBudgets({ fiscalYear: 2025 });
    expect(budgets).toHaveLength(1);
    expect(budgets[0].committed).toBe(8000);

    const order = await createPurchaseOrder({
      actorId: actor.id,
      payload: {
        supplierId: supplier.id,
        budgetId: budget.id,
        status: 'awaiting_approval',
        currency: 'GBP',
        items: [
          { itemName: 'Generator', quantity: 1, unitCost: 6500, taxRate: 20 },
          { itemName: 'Fuel cans', quantity: 10, unitCost: 45, taxRate: 5 }
        ]
      }
    });

    let trackedBudgets = await listPurchaseBudgets({ fiscalYear: 2025 });
    let tracked = trackedBudgets.find((entry) => entry.id === budget.id);
    expect(tracked.committed).toBeCloseTo(order.total, 2);
    expect(tracked.spent).toBe(0);

    await recordPurchaseReceipt({
      orderId: order.id,
      actorId: actor.id,
      items: order.items.map((item, index) => ({
        id: item.id,
        receivedQuantity: index === 0 ? item.quantity : Math.ceil(item.quantity / 2)
      }))
    });

    trackedBudgets = await listPurchaseBudgets({ fiscalYear: 2025 });
    tracked = trackedBudgets.find((entry) => entry.id === budget.id);
    expect(tracked.spent).toBeGreaterThan(0);
    expect(tracked.committed).toBeLessThan(order.total);

    await updatePurchaseOrderStatus({ orderId: order.id, nextStatus: 'cancelled', actorId: actor.id });

    trackedBudgets = await listPurchaseBudgets({ fiscalYear: 2025 });
    tracked = trackedBudgets.find((entry) => entry.id === budget.id);
    expect(tracked.committed).toBe(0);
    expect(tracked.spent).toBeGreaterThan(0);
  });
});

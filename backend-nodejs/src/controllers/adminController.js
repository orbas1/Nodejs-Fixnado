import { Escrow, Dispute, Order } from '../models/index.js';

export async function dashboard(req, res, next) {
  try {
    const [escrowCount, disputes, liveOrders] = await Promise.all([
      Escrow.count({ where: { status: 'funded' } }),
      Dispute.findAll({ limit: 10, order: [['createdAt', 'DESC']] }),
      Order.count({ where: { status: 'in_progress' } })
    ]);

    res.json({
      metrics: {
        activeEscrows: escrowCount,
        openDisputes: disputes.filter((d) => d.status !== 'resolved').length,
        liveOrders
      },
      disputes
    });
  } catch (error) {
    next(error);
  }
}

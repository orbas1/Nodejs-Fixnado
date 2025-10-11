import { validationResult } from 'express-validator';
import { Service, Order, Escrow, sequelize } from '../models/index.js';

export async function listServices(req, res, next) {
  try {
    const services = await Service.findAll({ limit: 50, order: [['createdAt', 'DESC']] });
    res.json(services);
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const service = await Service.create({
      providerId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      currency: req.body.currency || 'USD'
    });

    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
}

export async function purchaseService(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(422).json({ errors: errors.array() });
    }

    const service = await Service.findByPk(req.params.serviceId, { transaction });
    if (!service) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }

    const order = await Order.create(
      {
        buyerId: req.user.id,
        serviceId: service.id,
        totalAmount: req.body.totalAmount || service.price,
        currency: req.body.currency || service.currency,
        status: 'funded',
        scheduledFor: req.body.scheduledFor
      },
      { transaction }
    );

    const escrow = await Escrow.create(
      {
        orderId: order.id,
        status: 'funded',
        fundedAt: new Date()
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({ order, escrow });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}

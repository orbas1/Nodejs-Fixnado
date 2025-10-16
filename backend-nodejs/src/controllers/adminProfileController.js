import { getAdminProfile, upsertAdminProfile } from '../services/adminProfileService.js';

export async function fetchAdminProfile(req, res, next) {
  try {
    const profile = await getAdminProfile(req.user?.id);
    res.json({ profile });
import {
  getAdminProfileSettings,
  updateAdminProfileSettings,
  createAdminDelegate,
  updateAdminDelegate,
  deleteAdminDelegate
} from '../services/adminProfileService.js';

export async function fetchAdminProfileSettings(req, res, next) {
  try {
    const payload = await getAdminProfileSettings({ userId: req.user.id });
    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
}

export async function saveAdminProfile(req, res, next) {
  try {
    const profile = await upsertAdminProfile(req.user?.id, req.body ?? {}, req.user?.id);
    res.json({ profile });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode ?? 422).json({
export async function saveAdminProfileSettings(req, res, next) {
  try {
    const payload = await updateAdminProfileSettings({ userId: req.user.id, payload: req.body });
    res.json({ data: payload });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode || 422).json({
        message: error.message,
        details: error.details ?? []
      });
    }
    next(error);
  }
}

export async function createAdminProfileDelegate(req, res, next) {
  try {
    const delegate = await createAdminDelegate({ userId: req.user.id, payload: req.body });
    res.status(201).json({ data: delegate });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode || 422).json({
        message: error.message,
        details: error.details ?? []
      });
    }
    next(error);
  }
}

export async function updateAdminProfileDelegate(req, res, next) {
  try {
    const delegate = await updateAdminDelegate({
      userId: req.user.id,
      delegateId: req.params.id,
      payload: req.body
    });
    res.json({ data: delegate });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(error.statusCode || 422).json({
        message: error.message,
        details: error.details ?? []
      });
    }
    next(error);
  }
}

export async function deleteAdminProfileDelegate(req, res, next) {
  try {
    await deleteAdminDelegate({ userId: req.user.id, delegateId: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

import { validationResult } from 'express-validator';
import {
  getPipelineStatus,
  pauseAnalyticsPipeline,
  resumeAnalyticsPipeline
} from '../services/analyticsPipelineService.js';

export async function fetchAnalyticsPipelineStatus(req, res, next) {
  try {
    const status = await getPipelineStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function pauseAnalyticsPipelineHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { actor, reason, ticket } = req.body;
    const pipelineState = await pauseAnalyticsPipeline({ actor, reason, ticket });
    const status = await getPipelineStatus();
    res.json({ message: 'analytics pipeline paused', ...status, pipeline: pipelineState });
  } catch (error) {
    next(error);
  }
}

export async function resumeAnalyticsPipelineHandler(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { actor, reason, ticket } = req.body;
    const pipelineState = await resumeAnalyticsPipeline({ actor, reason, ticket });
    const status = await getPipelineStatus();
    res.json({ message: 'analytics pipeline resumed', ...status, pipeline: pipelineState });
  } catch (error) {
    next(error);
  }
}

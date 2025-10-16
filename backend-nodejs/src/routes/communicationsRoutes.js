import { Router } from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  postMessage,
  patchParticipant,
  createVideoSession
} from '../controllers/communicationsController.js';
import {
  fetchInboxSettings,
  putInboxSettings,
  postEntryPoint,
  patchEntryPoint,
  removeEntryPoint,
  postQuickReply,
  patchQuickReply,
  removeQuickReply,
  postEscalationRule,
  patchEscalationRule,
  removeEscalationRule
} from '../controllers/communicationsSettingsController.js';

const router = Router();

router.post('/', createConversation);
router.get('/settings/inbox', fetchInboxSettings);
router.put('/settings/inbox', putInboxSettings);
router.post('/settings/inbox/entry-points', postEntryPoint);
router.patch('/settings/inbox/entry-points/:entryPointId', patchEntryPoint);
router.delete('/settings/inbox/entry-points/:entryPointId', removeEntryPoint);
router.post('/settings/inbox/quick-replies', postQuickReply);
router.patch('/settings/inbox/quick-replies/:quickReplyId', patchQuickReply);
router.delete('/settings/inbox/quick-replies/:quickReplyId', removeQuickReply);
router.post('/settings/inbox/escalations', postEscalationRule);
router.patch('/settings/inbox/escalations/:escalationId', patchEscalationRule);
router.delete('/settings/inbox/escalations/:escalationId', removeEscalationRule);

router.get('/', listConversations);
router.get('/:conversationId', getConversation);
router.post('/:conversationId/messages', postMessage);
router.patch('/:conversationId/participants/:participantId', patchParticipant);
router.post('/:conversationId/video-session', createVideoSession);

export default router;

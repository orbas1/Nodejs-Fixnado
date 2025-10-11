import { Router } from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  postMessage,
  patchParticipant,
  createVideoSession
} from '../controllers/communicationsController.js';

const router = Router();

router.post('/', createConversation);
router.get('/', listConversations);
router.get('/:conversationId', getConversation);
router.post('/:conversationId/messages', postMessage);
router.patch('/:conversationId/participants/:participantId', patchParticipant);
router.post('/:conversationId/video-session', createVideoSession);

export default router;

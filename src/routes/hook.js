import express from 'express';
import { handleDocuSignWebhook } from '../hook/docusignHook.js';
const router = express.Router();
router.post('/docusign' ,handleDocuSignWebhook);

export default router;
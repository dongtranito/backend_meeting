import express from 'express';
import { verifyAccessToken } from '../middlewares/authMiddleware.js';
import {getListGroup, createGroup, deleteGroup, updateGroup, getDetailGroup, inviteMember} from '../controllers/groupController.js'
const router = express.Router();


router.use(verifyAccessToken);
router.get('/get-list-group', getListGroup);
router.post('/creat-group', createGroup);
router.put("/update-group/:groupId", updateGroup);
router.delete("/delete-group/:groupId", deleteGroup);
router.get("/detail-group/:groupId", getDetailGroup); 
router.post("/invite-member", inviteMember);

export default router;
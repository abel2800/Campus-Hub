const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const mobileController = require('../controllers/mobileController');

router.use(auth);

router.get('/search', mobileController.universalSearch);
router.get('/dashboard', mobileController.getDashboard);
router.get('/gamification', mobileController.getGamification);
router.post('/gamification/xp', mobileController.addXp);
router.get('/wallet', mobileController.getWallet);
router.post('/wallet/telebirr-pay', mobileController.telebirrPay);
router.post('/wallet/topup', mobileController.topUpWallet);
router.get('/clubs', mobileController.getClubs);
router.post('/clubs/:id/join', mobileController.joinClub);
router.get('/attendance', mobileController.getAttendance);
router.get('/voice-rooms', mobileController.getVoiceRooms);
router.post('/ai/chat', mobileController.aiChat);

module.exports = router;

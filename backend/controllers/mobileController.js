const { Op } = require('sequelize');
const {
  User, Course, Post, Enrollment,
  UserGamification, Wallet, WalletTransaction,
  Club, ClubMember, AttendanceRecord, VoiceRoom
} = require('../models');

async function getOrCreateGamification(userId) {
  const [record] = await UserGamification.findOrCreate({
    where: { userId },
    defaults: { xp: 120, level: 2, streak: 3, lastActiveDate: new Date().toISOString().slice(0, 10) }
  });
  return record;
}

async function getOrCreateWallet(userId) {
  const [wallet] = await Wallet.findOrCreate({
    where: { userId },
    defaults: { balance: 250.0, currency: 'ETB' }
  });
  return wallet;
}

const mobileController = {
  universalSearch: async (req, res) => {
    try {
      const q = (req.query.q || '').trim();
      if (!q) return res.json({ users: [], courses: [], posts: [] });

      const [users, courses, posts] = await Promise.all([
        User.findAll({
          where: {
            id: { [Op.ne]: req.user.id },
            [Op.or]: [
              { username: { [Op.iLike]: `%${q}%` } },
              { department: { [Op.iLike]: `%${q}%` } }
            ]
          },
          attributes: ['id', 'username', 'department', 'avatar'],
          limit: 10
        }),
        Course.findAll({
          where: {
            [Op.or]: [
              { title: { [Op.iLike]: `%${q}%` } },
              { description: { [Op.iLike]: `%${q}%` } }
            ]
          },
          limit: 10
        }),
        Post.findAll({
          where: { caption: { [Op.iLike]: `%${q}%` } },
          limit: 10
        })
      ]);

      res.json({ users, courses, posts, query: q });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getGamification: async (req, res) => {
    try {
      const record = await getOrCreateGamification(req.user.id);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addXp: async (req, res) => {
    try {
      const { amount = 10 } = req.body;
      const record = await getOrCreateGamification(req.user.id);
      const newXp = record.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      const today = new Date().toISOString().slice(0, 10);
      let streak = record.streak;
      if (record.lastActiveDate !== today) {
        streak += 1;
      }
      await record.update({ xp: newXp, level: newLevel, streak, lastActiveDate: today });
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getWallet: async (req, res) => {
    try {
      const wallet = await getOrCreateWallet(req.user.id);
      const transactions = await WalletTransaction.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 20
      });
      res.json({ wallet, transactions });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  telebirrPay: async (req, res) => {
    try {
      const { amount, description } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

      const wallet = await getOrCreateWallet(req.user.id);
      if (parseFloat(wallet.balance) < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      await wallet.update({ balance: parseFloat(wallet.balance) - amount });
      const tx = await WalletTransaction.create({
        userId: req.user.id,
        amount: -amount,
        type: 'payment',
        method: 'telebirr',
        description: description || 'Campus payment',
        status: 'completed'
      });

      res.json({ success: true, wallet, transaction: tx });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  topUpWallet: async (req, res) => {
    try {
      const { amount, method = 'telebirr' } = req.body;
      const wallet = await getOrCreateWallet(req.user.id);
      await wallet.update({ balance: parseFloat(wallet.balance) + parseFloat(amount) });
      const tx = await WalletTransaction.create({
        userId: req.user.id,
        amount,
        type: 'topup',
        method,
        description: `${method} top-up`,
        status: 'completed'
      });
      res.json({ success: true, wallet, transaction: tx });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getClubs: async (req, res) => {
    try {
      let clubs = await Club.findAll({ order: [['memberCount', 'DESC']] });
      if (clubs.length === 0) {
        await Club.bulkCreate([
          { name: 'Computer Science Society', description: 'CS students & tech', category: 'academic', memberCount: 248 },
          { name: 'Programming Club', description: 'Code, hackathons, projects', category: 'tech', memberCount: 186 },
          { name: 'Football Club', description: 'Campus football league', category: 'sports', memberCount: 320 },
          { name: 'Class of 2025', description: 'Graduating class community', category: 'class', memberCount: 412 }
        ]);
        clubs = await Club.findAll();
      }
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  joinClub: async (req, res) => {
    try {
      const clubId = req.params.id;
      const [, created] = await ClubMember.findOrCreate({
        where: { clubId, userId: req.user.id }
      });
      if (created) {
        const club = await Club.findByPk(clubId);
        if (club) await club.update({ memberCount: club.memberCount + 1 });
      }
      res.json({ success: true, joined: created });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAttendance: async (req, res) => {
    try {
      const userId = req.user.id;
      let records = await AttendanceRecord.findAll({ where: { userId }, order: [['date', 'DESC']] });

      if (records.length === 0) {
        const today = new Date();
        const seed = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (d.getDay() === 0 || d.getDay() === 6) continue;
          seed.push({
            userId,
            date: d.toISOString().slice(0, 10),
            status: Math.random() > 0.08 ? 'present' : 'absent'
          });
        }
        await AttendanceRecord.bulkCreate(seed);
        records = await AttendanceRecord.findAll({ where: { userId } });
      }

      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const percentage = total ? Math.round((present / total) * 100) : 0;

      res.json({ percentage, present, total, records: records.slice(0, 30) });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getVoiceRooms: async (req, res) => {
    try {
      let rooms = await VoiceRoom.findAll({ where: { isLive: true }, order: [['createdAt', 'DESC']] });
      if (rooms.length === 0) {
        await VoiceRoom.bulkCreate([
          { name: 'Study Room — Algorithms', topic: 'Midterm prep', hostId: req.user.id, participantCount: 12 },
          { name: 'CS Lounge', topic: 'Project help', hostId: req.user.id, participantCount: 8 },
          { name: 'English Practice', topic: 'Speaking club', hostId: req.user.id, participantCount: 5 }
        ]);
        rooms = await VoiceRoom.findAll({ where: { isLive: true } });
      }
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  aiChat: async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user.id;
      const enrollments = await Enrollment.count({ where: { userId } });
      const gamification = await getOrCreateGamification(userId);

      const lower = (message || '').toLowerCase();
      let reply = `Hi ${req.user.username || 'there'}! I'm your Campus Hub AI assistant.`;

      if (lower.includes('assignment') || lower.includes('homework')) {
        reply = 'You have assignments due this week. Check your enrolled courses — I recommend starting with your highest-priority deadline first.';
      } else if (lower.includes('gpa') || lower.includes('grade')) {
        reply = 'Based on your course progress, you\'re on track. Open Grades in your profile for detailed analytics.';
      } else if (lower.includes('summar')) {
        reply = 'I can summarize lectures once you share the topic. Try: "Summarize today\'s database lecture".';
      } else if (lower.includes('quiz')) {
        reply = 'I\'ll generate a 5-question quiz from your course material. Which subject — Algorithms, Database, or Software Engineering?';
      } else if (lower.includes('streak') || lower.includes('xp')) {
        reply = `You're Level ${gamification.level} with ${gamification.xp} XP and a ${gamification.streak}-day study streak. Keep it up!`;
      } else {
        reply = `You're enrolled in ${enrollments} course(s). Ask me to explain topics, summarize lectures, create quizzes, or plan your study schedule.`;
      }

      res.json({ reply, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      const [gamification, wallet, attendance, enrollments] = await Promise.all([
        getOrCreateGamification(userId),
        getOrCreateWallet(userId),
        AttendanceRecord.findAll({ where: { userId } }),
        Enrollment.findAll({ where: { userId }, include: [{ model: Course, as: 'course' }] })
      ]);

      const total = attendance.length;
      const present = attendance.filter(a => a.status === 'present').length;
      const attendancePct = total ? Math.round((present / total) * 100) : 92;

      res.json({
        gamification,
        wallet,
        attendance: attendancePct,
        enrolledCourses: enrollments.length,
        nextClass: enrollments[0]?.Course?.title || enrollments[0]?.course?.title || 'Explore courses'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = mobileController;

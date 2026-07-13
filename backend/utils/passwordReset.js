const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, PasswordReset } = require('../models');
const { Op } = require('sequelize');

const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { ok: true, message: 'If that email is registered, you will receive reset instructions.' };
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  await PasswordReset.update(
    { usedAt: new Date() },
    { where: { userId: user.id, usedAt: null } }
  );

  await PasswordReset.create({
    userId: user.id,
    token: tokenHash,
    expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
  });

  const payload = {
    ok: true,
    message: 'If that email is registered, you will receive reset instructions.',
  };

  // Dev/local: return token so apps can reset without email server
  if (process.env.NODE_ENV !== 'production') {
    payload.devResetToken = rawToken;
    payload.devResetUrl = `/reset-password?token=${rawToken}`;
  }

  console.log(`[Password reset] user=${user.email} token=${rawToken}`);

  return payload;
}

async function resetPassword(rawToken, newPassword) {
  if (!rawToken || !newPassword || newPassword.length < 6) {
    const err = new Error('Token and password (min 6 characters) are required');
    err.status = 400;
    throw err;
  }

  const tokenHash = hashToken(rawToken);
  const record = await PasswordReset.findOne({
    where: {
      token: tokenHash,
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!record) {
    const err = new Error('Invalid or expired reset link');
    err.status = 400;
    throw err;
  }

  const user = await User.findByPk(record.userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  record.usedAt = new Date();
  await record.save();

  return { ok: true, message: 'Password updated successfully. You can sign in now.' };
}

module.exports = { requestPasswordReset, resetPassword };

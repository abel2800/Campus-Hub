const crypto = require('crypto');
const { OtpCode } = require('../models');
const { Op } = require('sequelize');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function logOtp(purpose, email, code) {
  const line = `[OTP] purpose=${purpose} email=${email.toLowerCase()} code=${code}`;
  console.log('\n' + '═'.repeat(50));
  console.log(line);
  console.log('═'.repeat(50) + '\n');
}

async function invalidateOld(email, purpose) {
  await OtpCode.update(
    { usedAt: new Date() },
    { where: { email: email.toLowerCase(), purpose, usedAt: null } }
  );
}

async function createOtp(email, purpose, payload = null) {
  const normalizedEmail = email.toLowerCase();
  const code = generateOtp();
  const codeHash = hashCode(code);

  await invalidateOld(normalizedEmail, purpose);

  await OtpCode.create({
    email: normalizedEmail,
    purpose,
    codeHash,
    payload: payload ? JSON.stringify(payload) : null,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  logOtp(purpose, normalizedEmail, code);

  return {
    ok: true,
    message: `OTP sent to ${normalizedEmail}. Check the API terminal for your code.`,
  };
}

async function verifyOtp(email, purpose, code) {
  if (!email || !code) {
    const err = new Error('Email and OTP are required');
    err.status = 400;
    throw err;
  }

  const record = await OtpCode.findOne({
    where: {
      email: email.toLowerCase(),
      purpose,
      codeHash: hashCode(String(code).trim()),
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['createdAt', 'DESC']],
  });

  if (!record) {
    const err = new Error('Invalid or expired OTP');
    err.status = 400;
    throw err;
  }

  record.usedAt = new Date();
  await record.save();

  const payload = record.payload ? JSON.parse(record.payload) : null;
  return { record, payload };
}

module.exports = { createOtp, verifyOtp, logOtp };

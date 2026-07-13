const { Teacher } = require('../models');

async function resolveUserRole(user) {
  const teacher = await Teacher.findOne({ where: { userId: user.id } });
  if (teacher) return 'teacher';
  if (user.username && user.username.toLowerCase().includes('teacher')) {
    return 'teacher';
  }
  return 'student';
}

function serializeUser(user, role) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    department: user.department || null,
    avatar: user.avatar || user.avatarUrl || null,
    bio: user.bio || null,
    role,
  };
}

async function buildAuthResponse(user, token) {
  const role = await resolveUserRole(user);
  return {
    success: true,
    token,
    user: serializeUser(user, role),
  };
}

module.exports = { buildAuthResponse, resolveUserRole, serializeUser };

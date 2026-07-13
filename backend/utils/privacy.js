const { areFriends } = require('./friendship');

function getPrivacySettings(user) {
  const defaults = {
    profileVisibility: 'public',
    searchable: true,
    showCourses: true,
    showFriendsList: true,
  };
  const raw = user?.privacySettings;
  if (!raw || typeof raw !== 'object') return defaults;
  return { ...defaults, ...raw };
}

function isPrivateProfile(user) {
  const visibility = getPrivacySettings(user).profileVisibility;
  return visibility === 'private' || visibility === 'friends';
}

/** Instagram-style: private = only friends (and self) see posts. */
async function canViewPosts(viewerId, targetUser) {
  if (!targetUser) return false;
  if (Number(viewerId) === Number(targetUser.id)) return true;
  if (!isPrivateProfile(targetUser)) return true;
  return areFriends(viewerId, targetUser.id);
}

async function canViewCourses(viewerId, targetUser) {
  if (!targetUser) return false;
  if (Number(viewerId) === Number(targetUser.id)) return true;
  const privacy = getPrivacySettings(targetUser);
  if (!privacy.showCourses) return false;
  return canViewPosts(viewerId, targetUser);
}

/** Friend list: owner always; others only if showFriendsList and they can see profile content. */
async function canViewFriendsList(viewerId, targetUser) {
  if (!targetUser) return false;
  if (Number(viewerId) === Number(targetUser.id)) return true;
  const privacy = getPrivacySettings(targetUser);
  if (privacy.showFriendsList === false) return false;
  return canViewPosts(viewerId, targetUser);
}

module.exports = {
  getPrivacySettings,
  isPrivateProfile,
  canViewPosts,
  canViewCourses,
  canViewFriendsList,
};

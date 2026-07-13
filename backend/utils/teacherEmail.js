const TEACHER_EMAIL_PATTERN = /^[^\s@]+@teacher\.edu$/i;

function isTeacherEmail(email) {
  return TEACHER_EMAIL_PATTERN.test(String(email || '').trim().toLowerCase());
}

function assertTeacherEmail(email) {
  if (!isTeacherEmail(email)) {
    const err = new Error('Teachers must register with a @teacher.edu email address');
    err.status = 400;
    throw err;
  }
}

function assertStudentEmail(email) {
  if (isTeacherEmail(email)) {
    const err = new Error('Student accounts cannot use a @teacher.edu email. Choose Teacher role instead.');
    err.status = 400;
    throw err;
  }
}

module.exports = { isTeacherEmail, assertTeacherEmail, assertStudentEmail };

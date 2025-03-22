const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/courses',
  'uploads/courses/videos',
  'uploads/courses/thumbnails'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Configure file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    let uploadPath = path.join(__dirname, '..', 'uploads');
    
    if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, '..', 'uploads/courses/videos');
    } else if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(__dirname, '..', 'uploads/courses/thumbnails');
    } else if (file.fieldname === 'course_image') {
      uploadPath = path.join(__dirname, '..', 'uploads/courses');
    }
    
    console.log(`File will be stored in: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    const newFilename = `${file.fieldname}-${uniqueSuffix}${fileExt}`;
    
    console.log(`Generated filename: ${newFilename}`);
    cb(null, newFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file types
  if (file.fieldname === 'video') {
    // Allow video files
    if (file.mimetype.startsWith('video/')) {
      return cb(null, true);
    }
    console.log(`Rejected video file of type: ${file.mimetype}`);
    cb(new Error('Only video files are allowed!'), false);
  } else if (file.fieldname === 'thumbnail' || file.fieldname === 'course_image') {
    // Allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    console.log(`Rejected image file of type: ${file.mimetype}`);
    cb(new Error('Only image files are allowed!'), false);
  } else {
    // Default: accept file
    return cb(null, true);
  }
};

// Create multer instance with configuration
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 100 // 100MB file size limit
  }
});

module.exports = upload; 
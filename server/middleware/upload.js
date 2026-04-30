const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const mimeExtensionMap = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const normalizedExt = mimeExtensionMap[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${normalizedExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = Boolean(mimeExtensionMap[file.mimetype]);
  const isAllowedExtension = allowedExtensions.includes(ext) || ext === '';

  if (isAllowedMime && isAllowedExtension) {
    return cb(null, true);
  }

  return cb(new Error('Only JPG, PNG, GIF, and WEBP image files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;

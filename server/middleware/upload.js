const multer = require('multer');

const mimeExtensionMap = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const path = require('path');
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

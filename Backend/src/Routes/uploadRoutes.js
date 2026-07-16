import express from 'express';
import { upload } from '../Middlewares/upload.js';
import { imagekit } from '../Utils/imagekit.js';
import { protect } from '../Middlewares/auth.js';

const router = express.Router();

// @desc    Upload an image to ImageKit
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    // Upload buffer to ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${Date.now()}-${req.file.originalname}`,
      folder: '/fleetflow_uploads',
    });

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: result.url,
      fileId: result.fileId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `ImageKit upload failed: ${error.message}`,
    });
  }
});

export default router;

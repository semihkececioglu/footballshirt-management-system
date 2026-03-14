import { uploadImage } from '../services/cloudinary.service.js';

export async function uploadImages(req, res, next) {
  try {
    const files = req.files || [];
    const images = await Promise.all(
      files.map((f) => uploadImage(f.buffer, 'forma'))
    );
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
}

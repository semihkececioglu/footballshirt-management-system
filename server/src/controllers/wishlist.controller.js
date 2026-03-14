import Wishlist from '../models/Wishlist.model.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { createError } from '../middleware/error.middleware.js';

export async function getWishlist(req, res, next) {
  try {
    const { status = 'active', brand, league, priority } = req.query;
    const filter = status !== 'all' ? { status } : {};
    if (brand) filter.brand = brand;
    if (league) filter.league = league;
    if (priority) filter.priority = priority;
    const items = await Wishlist.find(filter).sort('sortOrder -createdAt');
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createWishlistItem(req, res, next) {
  try {
    const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    if (req.file) {
      const img = await uploadImage(req.file.buffer, 'forma/wishlist');
      data.image = img.url;
      data.imagePublicId = img.publicId;
    }
    const item = await Wishlist.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateWishlistItem(req, res, next) {
  try {
    const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    if (req.file) {
      // Delete old image from Cloudinary if exists
      const old = await Wishlist.findById(req.params.id).select('imagePublicId');
      if (old?.imagePublicId) await deleteImage(old.imagePublicId).catch(() => {});
      const img = await uploadImage(req.file.buffer, 'forma/wishlist');
      data.image = img.url;
      data.imagePublicId = img.publicId;
    }
    const item = await Wishlist.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!item) return next(createError('İtem bulunamadı', 404));
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteWishlistItem(req, res, next) {
  try {
    const item = await Wishlist.findByIdAndDelete(req.params.id);
    if (item?.imagePublicId) await deleteImage(item.imagePublicId).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function reorderWishlist(req, res, next) {
  try {
    const { items } = req.body; // [{ id, sortOrder }]
    await Promise.all(items.map(({ id, sortOrder }) =>
      Wishlist.findByIdAndUpdate(id, { sortOrder })
    ));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

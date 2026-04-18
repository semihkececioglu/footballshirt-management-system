import Wishlist from '../models/Wishlist.model.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { createError } from '../middleware/error.middleware.js';

export async function getWishlist(req, res, next) {
  try {
    const { status, brand, league, priority, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (brand) filter.brand = brand;
    if (league) filter.league = league;
    if (priority) filter.priority = priority;
    if (q) filter.teamName = { $regex: q, $options: 'i' };
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Wishlist.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Wishlist.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, total, page: Number(page) });
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

export async function bulkDeleteWishlistItems(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids required' });
    const items = await Wishlist.find({ _id: { $in: ids } }).select('imagePublicId');
    for (const item of items) {
      if (item.imagePublicId) await deleteImage(item.imagePublicId).catch(() => {});
    }
    await Wishlist.deleteMany({ _id: { $in: ids } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function bulkCancelWishlistItems(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids required' });
    await Wishlist.updateMany({ _id: { $in: ids } }, { status: 'cancelled' });
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

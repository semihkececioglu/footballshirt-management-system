import Seller from '../models/Seller.model.js';
import { createError } from '../middleware/error.middleware.js';

export async function getSellers(req, res, next) {
  try {
    const sellers = await Seller.find().sort('name');
    res.json({ success: true, data: sellers });
  } catch (err) {
    next(err);
  }
}

export async function createSeller(req, res, next) {
  try {
    const seller = await Seller.create(req.body);
    res.status(201).json({ success: true, data: seller });
  } catch (err) {
    next(err);
  }
}

export async function updateSeller(req, res, next) {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!seller) return next(createError('Satıcı bulunamadı', 404));
    res.json({ success: true, data: seller });
  } catch (err) {
    next(err);
  }
}

export async function deleteSeller(req, res, next) {
  try {
    await Seller.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

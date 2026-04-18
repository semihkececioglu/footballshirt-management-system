import Seller from '../models/Seller.model.js';
import Purchase from '../models/Purchase.model.js';
import { createError } from '../middleware/error.middleware.js';

export async function getSellers(req, res, next) {
  try {
    const sellers = await Seller.find().sort('name');
    res.json({ success: true, data: sellers });
  } catch (err) {
    next(err);
  }
}

export async function getSellerStats(req, res, next) {
  try {
    const agg = await Purchase.aggregate([
      { $match: { seller: { $exists: true, $ne: null } } },
      {
        $addFields: {
          totalQty: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$sizeVariants', []] } }, 0] },
              { $sum: '$sizeVariants.stockCount' },
              1,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$seller',
          purchaseCount: { $sum: 1 },
          totalSpent: { $sum: { $multiply: ['$buyPrice', '$totalQty'] } },
          lastPurchaseDate: { $max: '$purchaseDate' },
        },
      },
    ]);

    const statsMap = Object.fromEntries(
      agg.map((d) => [d._id.toString(), { purchaseCount: d.purchaseCount, totalSpent: d.totalSpent, lastPurchaseDate: d.lastPurchaseDate }])
    );

    res.json({ success: true, data: statsMap });
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

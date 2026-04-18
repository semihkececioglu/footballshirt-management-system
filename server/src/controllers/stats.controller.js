import Jersey from '../models/Jersey.model.js';
import Sale from '../models/Sale.model.js';
import Purchase from '../models/Purchase.model.js';
import Wishlist from '../models/Wishlist.model.js';
import Seller from '../models/Seller.model.js';
import Reminder from '../models/Reminder.model.js';
import { createError } from '../middleware/error.middleware.js';

export async function getOverview(req, res, next) {
  try {
    const [totalForSale, totalSold, salesAgg, stockValueAgg, purchasesAgg] = await Promise.all([
      Jersey.countDocuments({ status: 'for_sale' }),
      Jersey.countDocuments({ status: 'sold' }),
      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$salePrice' },
            totalBuyCost: { $sum: '$buyPrice' },
            count: { $sum: 1 },
          },
        },
      ]),
      Jersey.aggregate([
        { $match: { status: 'for_sale' } },
        { $group: { _id: null, value: { $sum: { $multiply: ['$sellPrice', '$stockCount'] } } } },
      ]),
      Purchase.aggregate([
        {
          $addFields: {
            totalQty: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$sizeVariants', []] } }, 0] },
                then: { $sum: '$sizeVariants.stockCount' },
                else: 1,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            itemCount: { $sum: '$totalQty' },
            spend: { $sum: { $multiply: ['$buyPrice', '$totalQty'] } },
          },
        },
      ]),
    ]);

    const totalRevenue = salesAgg[0]?.totalRevenue || 0;
    const totalBuyCost = salesAgg[0]?.totalBuyCost || 0;

    res.json({
      success: true,
      data: {
        totalForSale,
        totalSold,
        totalPurchased: purchasesAgg[0]?.count || 0,
        totalPurchaseItems: purchasesAgg[0]?.itemCount || 0,
        totalPurchaseSpend: purchasesAgg[0]?.spend || 0,
        totalRevenue,
        totalCost: totalBuyCost,
        netProfit: totalRevenue - totalBuyCost,
        stockValue: stockValueAgg[0]?.value || 0,
        totalSales: salesAgg[0]?.count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyPurchases(req, res, next) {
  try {
    const { year } = req.query;
    const matchYear = year ? { $expr: { $eq: [{ $year: '$purchaseDate' }, Number(year)] } } : {};
    const data = await Purchase.aggregate([
      { $match: matchYear },
      {
        $addFields: {
          totalQty: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$sizeVariants', []] } }, 0] },
              then: { $sum: '$sizeVariants.stockCount' },
              else: 1,
            },
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$purchaseDate' }, month: { $month: '$purchaseDate' } },
          count: { $sum: 1 },
          itemCount: { $sum: '$totalQty' },
          spend: { $sum: { $multiply: ['$buyPrice', '$totalQty'] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $addFields: { year: '$_id.year', month: '$_id.month' } },
      { $project: { _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlySales(req, res, next) {
  try {
    const { year } = req.query;
    const matchYear = year ? { $expr: { $eq: [{ $year: '$soldAt' }, Number(year)] } } : {};

    const data = await Sale.aggregate([
      { $match: matchYear },
      {
        $group: {
          _id: { year: { $year: '$soldAt' }, month: { $month: '$soldAt' } },
          revenue: { $sum: '$salePrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $addFields: { year: '$_id.year', month: '$_id.month' } },
      { $project: { _id: 0 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTeamStats(req, res, next) {
  try {
    const data = await Sale.aggregate([
      {
        $lookup: {
          from: 'jerseys',
          localField: 'jerseyId',
          foreignField: '_id',
          as: 'jersey',
        },
      },
      { $unwind: '$jersey' },
      {
        $group: {
          _id: '$jersey.teamName',
          count: { $sum: 1 },
          revenue: { $sum: '$salePrice' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $addFields: { teamName: '$_id' } },
      { $project: { _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSizeStats(req, res, next) {
  try {
    const data = await Sale.aggregate([
      {
        $lookup: { from: 'jerseys', localField: 'jerseyId', foreignField: '_id', as: 'jersey' },
      },
      { $unwind: '$jersey' },
      { $group: { _id: '$jersey.size', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $addFields: { size: '$_id' } },
      { $project: { _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPlatformStats(req, res, next) {
  try {
    const data = await Sale.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 }, revenue: { $sum: '$salePrice' } } },
      { $sort: { count: -1 } },
      { $addFields: { platform: '$_id' } },
      { $project: { _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getBuyerStats(req, res, next) {
  try {
    const data = await Sale.aggregate([
      { $match: { buyerName: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$buyerName',
          count: { $sum: 1 },
          totalSpent: { $sum: '$salePrice' },
          lastPurchase: { $max: '$soldAt' },
        },
      },
      { $sort: { count: -1 } },
      { $addFields: { buyerName: '$_id' } },
      { $project: { _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}


export async function getAverageSaleTime(req, res, next) {
  try {
    const result = await Sale.aggregate([
      { $lookup: { from: 'purchases', localField: 'jerseyId', foreignField: 'linkedJerseyId', as: 'purchase' } },
      { $unwind: { path: '$purchase', preserveNullAndEmptyArrays: false } },
      { $addFields: { days: { $divide: [{ $subtract: ['$soldAt', '$purchase.purchaseDate'] }, 86400000] } } },
      { $match: { days: { $gte: 0 } } },
      { $group: { _id: null, avg: { $avg: '$days' }, min: { $min: '$days' }, max: { $max: '$days' }, count: { $sum: 1 } } },
    ]);
    const d = result[0] || { avg: 0, min: 0, max: 0, count: 0 };
    res.json({ success: true, data: { avgDays: Math.round(d.avg), minDays: Math.round(d.min), maxDays: Math.round(d.max), count: d.count } });
  } catch (err) {
    next(err);
  }
}

export async function getCounts(req, res, next) {
  try {
    const [forSale, sold, wishlist, sellers, purchased, remindersOpen] = await Promise.all([
      Jersey.countDocuments({ status: 'for_sale' }),
      Sale.countDocuments(),
      Wishlist.countDocuments(),
      Seller.countDocuments(),
      Purchase.countDocuments(),
      Reminder.countDocuments({ status: 'open' }),
    ]);
    res.json({ success: true, data: { forSale, sold, wishlist, sellers, purchased, remindersOpen } });
  } catch (err) {
    next(err);
  }
}

import Sale from '../models/Sale.model.js';
import { createError } from '../middleware/error.middleware.js';

function toArr(val) {
  if (!val) return null;
  const arr = String(val).split(',').map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

export async function createSale(req, res, next) {
  try {
    const sale = await Sale.create(req.body);
    const populated = await Sale.findById(sale._id).populate('jerseyId');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function getSales(req, res, next) {
  try {
    const {
      platform, paymentMethod, type, brand,
      search,
      dateFrom, dateTo,
      sort = '-soldAt',
      page = 1, limit = 50,
    } = req.query;

    const filter = {};

    const platforms = toArr(platform);
    if (platforms) filter.platform = platforms.length === 1 ? platforms[0] : { $in: platforms };

    const paymentMethods = toArr(paymentMethod);
    if (paymentMethods) filter.paymentMethod = paymentMethods.length === 1 ? paymentMethods[0] : { $in: paymentMethods };

    const types = toArr(type);
    if (types) filter.type = types.length === 1 ? types[0] : { $in: types };

    const brands = toArr(brand);
    if (brands) filter.brand = brands.length === 1 ? brands[0] : { $in: brands };

    if (search) {
      filter.teamName = { $regex: search, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.soldAt = {};
      if (dateFrom) filter.soldAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.soldAt.$lte = end;
      }
    }

    const allowedSorts = ['-soldAt', 'soldAt', '-salePrice', 'salePrice', '-buyPrice', 'buyPrice'];
    const safeSort = allowedSorts.includes(sort) ? sort : '-soldAt';

    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      Sale.find(filter).populate('jerseyId').sort(safeSort).skip(skip).limit(Number(limit)),
      Sale.countDocuments(filter),
    ]);
    res.json({ success: true, data: sales, total });
  } catch (err) {
    next(err);
  }
}

export async function getSaleFilterOptions(req, res, next) {
  try {
    const [platforms, paymentMethods, types, brands] = await Promise.all([
      Sale.distinct('platform'),
      Sale.distinct('paymentMethod'),
      Sale.distinct('type'),
      Sale.distinct('brand'),
    ]);
    const clean = (arr) => arr.filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
    res.json({
      success: true,
      data: {
        platforms: clean(platforms),
        paymentMethods: clean(paymentMethods),
        types: clean(types),
        brands: clean(brands),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSale(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id).populate('jerseyId');
    if (!sale) return next(createError('Satış bulunamadı', 404));
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

export async function updateSale(req, res, next) {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return next(createError('Satış bulunamadı', 404));
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

export async function deleteSale(req, res, next) {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

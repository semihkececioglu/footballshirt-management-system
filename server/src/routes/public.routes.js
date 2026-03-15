import { Router } from 'express';
import Jersey from '../models/Jersey.model.js';
import Settings from '../models/Settings.model.js';

const router = Router();

// Public — for-sale jerseys only, sensitive fields excluded
router.get('/jerseys', async (req, res, next) => {
  try {
    const { team, league, country, season, type, quality, brand, size, condition, featured,
            primaryColor, minPrice, maxPrice, search, sort = '-createdAt', page = 1, limit = 24 } = req.query;

    const filter = {
      status: 'for_sale',
      $or: [
        { stockCount: { $gt: 0 } },
        { sizeVariants: { $elemMatch: { stockCount: { $gt: 0 } } } },
      ],
    };
    if (team) filter.teamName = { $regex: team, $options: 'i' };
    if (league) filter.league = league;
    if (country) filter.country = country;
    if (season) filter.season = season;
    if (type) filter.type = type;
    if (quality) filter.quality = quality;
    if (brand) filter.brand = brand;
    if (size) filter.$and = [
      ...(filter.$and || []),
      { $or: [{ size }, { 'sizeVariants.size': size }] },
    ];
    if (condition) filter.condition = condition;
    if (primaryColor) filter.primaryColor = primaryColor;
    if (featured === 'true') filter.featured = true;
    if (minPrice || maxPrice) {
      filter.sellPrice = {};
      if (minPrice) filter.sellPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellPrice.$lte = Number(maxPrice);
    }
    if (search) filter.teamName = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const select = 'images teamName country league season type quality brand size sizeVariants condition sellPrice measurements printing sponsor platforms featured productCode primaryColor detailColor notes';

    const [jerseys, total, stockAgg] = await Promise.all([
      Jersey.find(filter, select).sort(sort).skip(skip).limit(Number(limit)),
      Jersey.countDocuments(filter),
      Jersey.aggregate([
        { $match: { status: 'for_sale' } },
        {
          $project: {
            stock: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$sizeVariants', []] } }, 0] },
                { $sum: '$sizeVariants.stockCount' },
                '$stockCount',
              ],
            },
          },
        },
        { $group: { _id: null, totalStock: { $sum: '$stock' } } },
      ]),
    ]);

    const totalStock = stockAgg[0]?.totalStock || 0;

    res.json({ success: true, data: jerseys, total, totalStock, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// Single jersey by id (public)
router.get('/jerseys/:id', async (req, res, next) => {
  try {
    const select = 'images teamName country league season type quality brand size sizeVariants condition sellPrice measurements printing sponsor platforms featured productCode primaryColor detailColor notes';
    const jersey = await Jersey.findOne({ _id: req.params.id, status: 'for_sale' }, select);
    if (!jersey) return res.status(404).json({ success: false, message: 'Forma bulunamadı' });
    res.json({ success: true, data: jersey });
  } catch (err) {
    next(err);
  }
});

// Public filter options
router.get('/filter-options', async (req, res, next) => {
  try {
    const filter = { status: 'for_sale' };
    const [types, qualities, conditions, brands, leagues, seasons, primaryColors] = await Promise.all([
      Jersey.distinct('type', filter),
      Jersey.distinct('quality', filter),
      Jersey.distinct('condition', filter),
      Jersey.distinct('brand', filter),
      Jersey.distinct('league', filter),
      Jersey.distinct('season', filter),
      Jersey.distinct('primaryColor', filter),
    ]);
    const clean = (arr) => arr.filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
    res.json({ success: true, data: {
      types: clean(types),
      qualities: clean(qualities),
      conditions: clean(conditions),
      brands: clean(brands),
      leagues: clean(leagues),
      seasons: clean(seasons),
      primaryColors: primaryColors.filter(Boolean),
    } });
  } catch (err) {
    next(err);
  }
});

// Distinct team list for in-stock jerseys
router.get('/teams', async (req, res, next) => {
  try {
    const teams = await Jersey.distinct('teamName', {
      status: 'for_sale',
      $or: [
        { stockCount: { $gt: 0 } },
        { sizeVariants: { $elemMatch: { stockCount: { $gt: 0 } } } },
      ],
    });
    res.json({ success: true, data: teams.filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr')) });
  } catch (err) {
    next(err);
  }
});

// Public settings (no auth required)
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ _id: 'singleton' });
    res.json({ success: true, data: settings || { vitrinTitle: 'Forma Koleksiyonu', contactLinks: [] } });
  } catch (err) {
    next(err);
  }
});

export default router;

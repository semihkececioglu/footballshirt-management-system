import Jersey from '../models/Jersey.model.js';
import Sale from '../models/Sale.model.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { createError } from '../middleware/error.middleware.js';

function toArray(val) {
  if (!val) return null;
  const arr = String(val).split(',').map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

export async function getJerseys(req, res, next) {
  try {
    const { status, team, league, country, season, type, quality, brand, size, condition,
            primaryColor, minPrice, maxPrice, search, featured,
            sort = '-createdAt', page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (featured === 'true') filter.featured = true;
    if (team) filter.teamName = { $regex: team, $options: 'i' };
    if (league) filter.league = league;
    if (country) filter.country = country;

    const seasons = toArray(season);
    if (seasons) filter.season = seasons.length === 1 ? seasons[0] : { $in: seasons };

    const types = toArray(type);
    if (types) filter.type = types.length === 1 ? types[0] : { $in: types };

    const qualities = toArray(quality);
    if (qualities) filter.quality = qualities.length === 1 ? qualities[0] : { $in: qualities };

    const brands = toArray(brand);
    if (brands) filter.brand = brands.length === 1 ? brands[0] : { $in: brands };

    const conditions = toArray(condition);
    if (conditions) filter.condition = conditions.length === 1 ? conditions[0] : { $in: conditions };

    const primaryColors = toArray(primaryColor);
    if (primaryColors) filter.primaryColor = primaryColors.length === 1 ? primaryColors[0] : { $in: primaryColors };

    const andClauses = [];

    const sizes = toArray(size);
    if (sizes) {
      andClauses.push({ $or: [{ size: { $in: sizes } }, { 'sizeVariants.size': { $in: sizes } }] });
    }

    if (minPrice || maxPrice) {
      filter.sellPrice = {};
      if (minPrice) filter.sellPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellPrice.$lte = Number(maxPrice);
    }
    if (search) {
      andClauses.push({
        $or: [
          { teamName: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (andClauses.length > 0) filter.$and = andClauses;

    const skip = (Number(page) - 1) * Number(limit);
    const [jerseys, total] = await Promise.all([
      Jersey.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Jersey.countDocuments(filter),
    ]);

    res.json({ success: true, data: jerseys, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

export async function getJersey(req, res, next) {
  try {
    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) return next(createError('Forma bulunamadı', 404));
    res.json({ success: true, data: jersey });
  } catch (err) {
    next(err);
  }
}

export async function createJersey(req, res, next) {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const files = req.files || [];

    const images = await Promise.all(
      files.map((f, i) =>
        uploadImage(f.buffer, 'forma/jerseys').then((img) => ({ ...img, isMain: i === 0 }))
      )
    );

    const jersey = await Jersey.create({ ...data, images });
    res.status(201).json({ success: true, data: jersey });
  } catch (err) {
    next(err);
  }
}

export async function updateJersey(req, res, next) {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const files = req.files || [];

    if (files.length > 0) {
      const newImages = await Promise.all(
        files.map((f) => uploadImage(f.buffer, 'forma/jerseys'))
      );
      data.images = [...(data.images || []), ...newImages];
    }

    const jersey = await Jersey.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!jersey) return next(createError('Forma bulunamadı', 404));
    res.json({ success: true, data: jersey });
  } catch (err) {
    next(err);
  }
}

export async function deleteJersey(req, res, next) {
  try {
    const jersey = await Jersey.findByIdAndDelete(req.params.id);
    if (!jersey) return next(createError('Forma bulunamadı', 404));
    await Promise.all(jersey.images.map((img) => deleteImage(img.publicId)));
    res.json({ success: true, message: 'Forma silindi' });
  } catch (err) {
    next(err);
  }
}

export async function duplicateJersey(req, res, next) {
  try {
    const jersey = await Jersey.findById(req.params.id).lean();
    if (!jersey) return next(createError('Forma bulunamadı', 404));
    delete jersey._id;
    delete jersey.createdAt;
    delete jersey.updatedAt;
    jersey.status = 'for_sale';
    jersey.stockCount = 1;
    const newJersey = await Jersey.create(jersey);
    res.status(201).json({ success: true, data: newJersey });
  } catch (err) {
    next(err);
  }
}

export async function markSold(req, res, next) {
  try {
    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) return next(createError('Forma bulunamadı', 404));

    const { buyerName, buyerUsername, buyerPhone, platform, listingUrl,
            salePrice, paymentMethod, soldAt, notes, soldSize } = req.body;

    if (jersey.sizeVariants && jersey.sizeVariants.length > 0) {
      // Multi-size variant mode
      const variantIndex = jersey.sizeVariants.findIndex(
        (v) => v.size === soldSize && v.stockCount > 0
      );
      if (variantIndex === -1) return next(createError('Bu beden stokta yok', 400));
      jersey.sizeVariants[variantIndex].stockCount -= 1;
      const hasStock = jersey.sizeVariants.some((v) => v.stockCount > 0);
      if (!hasStock) {
        jersey.status = 'sold';
      }
      jersey.markModified('sizeVariants');
    } else {
      // Legacy single-size mode
      if (jersey.stockCount > 1) {
        jersey.stockCount -= 1;
      } else {
        jersey.status = 'sold';
        jersey.stockCount = 0;
      }
    }

    await jersey.save();

    const sale = await Sale.create({
      jerseyId: jersey._id,
      buyerName, buyerUsername, buyerPhone,
      platform, listingUrl,
      salePrice: salePrice || jersey.sellPrice,
      paymentMethod, soldAt, notes,
      soldSize: soldSize || jersey.size,
    });

    res.json({ success: true, data: { jersey, sale } });
  } catch (err) {
    next(err);
  }
}

export async function deleteImage_handler(req, res, next) {
  try {
    const { publicId } = req.body;
    if (!publicId) return next(createError('publicId gerekli'));
    await deleteImage(publicId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function bulkDelete(req, res, next) {
  try {
    const { ids } = req.body;
    const jerseys = await Jersey.find({ _id: { $in: ids } });
    await Promise.all(jerseys.flatMap((j) => j.images.map((img) => deleteImage(img.publicId))));
    await Jersey.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} forma silindi` });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdatePrice(req, res, next) {
  try {
    const { ids, sellPrice } = req.body;
    await Jersey.updateMany({ _id: { $in: ids } }, { sellPrice });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getFilterOptions(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const [types, qualities, conditions, brands, leagues, seasons, sizesLegacy, sizesVariant, primaryColors] = await Promise.all([
      Jersey.distinct('type', filter),
      Jersey.distinct('quality', filter),
      Jersey.distinct('condition', filter),
      Jersey.distinct('brand', filter),
      Jersey.distinct('league', filter),
      Jersey.distinct('season', filter),
      Jersey.distinct('size', filter),
      Jersey.distinct('sizeVariants.size', filter),
      Jersey.distinct('primaryColor', filter),
    ]);
    const clean = (arr) => arr.filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
    const JERSEY_SIZE_ORDER = ['XS','S','M','L','XL','XXL','3XL','4XL','5XL'];
    const allSizes = [...new Set([...sizesLegacy, ...sizesVariant])].filter(Boolean);
    const sizes = allSizes.sort((a, b) => {
      const ai = JERSEY_SIZE_ORDER.indexOf(a);
      const bi = JERSEY_SIZE_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b, 'tr');
    });
    res.json({ success: true, data: {
      types: clean(types),
      qualities: clean(qualities),
      conditions: clean(conditions),
      brands: clean(brands),
      leagues: clean(leagues),
      seasons: clean(seasons),
      sizes,
      primaryColors: primaryColors.filter(Boolean),
    }});
  } catch (err) {
    next(err);
  }
}

export async function toggleFeatured(req, res, next) {
  try {
    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) return next(createError('Forma bulunamadı', 404));
    jersey.featured = !jersey.featured;
    await jersey.save();
    res.json({ success: true, data: { featured: jersey.featured } });
  } catch (err) {
    next(err);
  }
}

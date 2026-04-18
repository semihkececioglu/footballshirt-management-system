import Purchase from '../models/Purchase.model.js';
import Jersey from '../models/Jersey.model.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { createError } from '../middleware/error.middleware.js';

function toArr(val) {
  if (!val) return null;
  const arr = String(val).split(',').map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

export async function getPurchases(req, res, next) {
  try {
    const { isForResale, search, sellerName, type, quality, size, condition, brand, dateFrom, dateTo, sort = '-purchaseDate', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (isForResale !== undefined) filter.isForResale = isForResale === 'true';

    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom) filter.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) { const e = new Date(dateTo); e.setHours(23, 59, 59, 999); filter.purchaseDate.$lte = e; }
    }

    const types = toArr(type); if (types) filter.type = types.length === 1 ? types[0] : { $in: types };
    const qualities = toArr(quality); if (qualities) filter.quality = qualities.length === 1 ? qualities[0] : { $in: qualities };
    const sizes = toArr(size); if (sizes) filter.size = sizes.length === 1 ? sizes[0] : { $in: sizes };
    const conditions = toArr(condition); if (conditions) filter.condition = conditions.length === 1 ? conditions[0] : { $in: conditions };
    const brands = toArr(brand); if (brands) filter.brand = brands.length === 1 ? brands[0] : { $in: brands };

    if (search) filter.teamName = { $regex: search, $options: 'i' };
    if (sellerName) filter.sellerName = { $regex: sellerName, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = await Promise.all([
      Purchase.find(filter).populate('seller').sort(sort).skip(skip).limit(Number(limit)),
      Purchase.countDocuments(filter),
    ]);
    res.json({ success: true, data: purchases, total });
  } catch (err) {
    next(err);
  }
}

export async function getPurchaseFilterOptions(req, res, next) {
  try {
    const [types, qualities, conditions, brands, sizes, sellerNames, sellerPhones] = await Promise.all([
      Purchase.distinct('type'),
      Purchase.distinct('quality'),
      Purchase.distinct('condition'),
      Purchase.distinct('brand'),
      Purchase.distinct('size'),
      Purchase.distinct('sellerName'),
      Purchase.distinct('sellerPhone'),
    ]);
    const clean = (arr) => arr.filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
    res.json({ success: true, data: {
      types: clean(types), qualities: clean(qualities),
      conditions: clean(conditions), brands: clean(brands), sizes: clean(sizes),
      sellerNames: clean(sellerNames), sellerPhones: clean(sellerPhones),
    }});
  } catch (err) {
    next(err);
  }
}

export async function promotePurchase(req, res, next) {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return next(createError('Satın alma bulunamadı', 404));

    const { sellPrice = 0, extraImages = [], images } = req.body;
    const mergedImages = Array.isArray(images) && images.length > 0
      ? images
      : [...purchase.images, ...(Array.isArray(extraImages) ? extraImages : [])];

    const jersey = await Jersey.create({
      teamName: purchase.teamName,
      country: purchase.country,
      league: purchase.league,
      season: purchase.season,
      type: purchase.type,
      quality: purchase.quality,
      brand: purchase.brand,
      technology: purchase.technology,
      sponsor: purchase.sponsor,
      productCode: purchase.productCode,
      size: purchase.sizeVariants?.[0]?.size || purchase.size || '',
      measurements: purchase.measurements,
      condition: purchase.condition,
      printing: purchase.printing,
      primaryColor: purchase.primaryColor,
      detailColor: purchase.detailColor,
      images: mergedImages,
      notes: purchase.notes,
      buyPrice: purchase.buyPrice,
      sellPrice: Number(sellPrice),
      purchaseDate: purchase.purchaseDate,
      status: 'for_sale',
      sizeVariants: purchase.sizeVariants?.length
        ? purchase.sizeVariants
        : purchase.size ? [{ size: purchase.size, stockCount: 1 }] : [],
    });

    purchase.linkedJerseyId = jersey._id;
    purchase.isForResale = true;
    await purchase.save();

    res.json({ success: true, data: jersey });
  } catch (err) {
    next(err);
  }
}

export async function demotePurchase(req, res, next) {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return next(createError('Satın alma bulunamadı', 404));

    if (purchase.linkedJerseyId) {
      const jersey = await Jersey.findByIdAndDelete(purchase.linkedJerseyId);
      if (jersey?.images?.length) {
        await Promise.all(jersey.images.map((img) => deleteImage(img.publicId)));
      }
    }

    purchase.linkedJerseyId = undefined;
    purchase.isForResale = false;
    await purchase.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function createPurchase(req, res, next) {
  try {
    const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const files = req.files || [];
    const uploaded = await Promise.all(
      files.map((f) => uploadImage(f.buffer, 'forma/purchases'))
    );
    // Merge images passed as JSON (pre-uploaded) + any newly uploaded files
    const existingImages = Array.isArray(data.images) ? data.images : [];
    const purchase = await Purchase.create({ ...data, images: [...existingImages, ...uploaded] });
    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
}

export async function updatePurchase(req, res, next) {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!purchase) return next(createError('Satın alma bulunamadı', 404));
    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
}

export async function deletePurchase(req, res, next) {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) return next(createError('Satın alma bulunamadı', 404));
    await Promise.all(purchase.images.map((img) => deleteImage(img.publicId)));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function bulkDeletePurchases(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids required' });
    await Purchase.deleteMany({ _id: { $in: ids } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

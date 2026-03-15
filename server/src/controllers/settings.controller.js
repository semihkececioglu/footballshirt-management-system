import Settings from '../models/Settings.model.js';

export async function getSettings(req, res, next) {
  try {
    const settings = await Settings.findOneAndUpdate(
      { _id: 'singleton' },
      { $setOnInsert: { storeTitle: 'Forma Koleksiyonu', contactLinks: [], language: 'tr', currency: 'TRY' } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const { storeTitle, contactLinks, language, currency } = req.body;
    const update = {};
    if (storeTitle !== undefined) update.storeTitle = storeTitle;
    if (contactLinks !== undefined) update.contactLinks = contactLinks;
    if (language !== undefined) update.language = language;
    if (currency !== undefined) update.currency = currency;

    const settings = await Settings.findOneAndUpdate(
      { _id: 'singleton' },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

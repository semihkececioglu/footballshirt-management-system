import Reminder from '../models/Reminder.model.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { createError } from '../middleware/error.middleware.js';

export async function getReminders(req, res, next) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reminders = await Reminder.find(filter).sort('-createdAt');
    res.json({ success: true, data: reminders });
  } catch (err) {
    next(err);
  }
}

export async function createReminder(req, res, next) {
  try {
    const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    if (req.file) {
      const img = await uploadImage(req.file.buffer, 'forma/reminders');
      data.image = img.url;
      data.imagePublicId = img.publicId;
    }
    const reminder = await Reminder.create(data);
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
}

export async function updateReminder(req, res, next) {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reminder) return next(createError('Hatırlatıcı bulunamadı', 404));
    res.json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
}

export async function deleteReminder(req, res, next) {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (reminder?.imagePublicId) await deleteImage(reminder.imagePublicId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

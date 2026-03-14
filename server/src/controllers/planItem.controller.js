import PlanItem from '../models/PlanItem.model.js';
import { createError } from '../middleware/error.middleware.js';

// GET /api/planner?month=YYYY-MM
export async function getPlannerMonth(req, res, next) {
  try {
    const { month } = req.query;
    if (!month) return next(createError('month parametresi gerekli (YYYY-MM)', 400));

    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const items = await PlanItem.find({ date: { $gte: start, $lt: end } })
      .select('date type status')
      .sort('date');

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// GET /api/planner/day?date=YYYY-MM-DD
export async function getPlannerDay(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) return next(createError('date parametresi gerekli (YYYY-MM-DD)', 400));

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const items = await PlanItem.find({ date: { $gte: start, $lte: end } })
      .populate('jerseyId', 'teamName season type images')
      .sort('createdAt');

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// POST /api/planner
export async function createPlanItem(req, res, next) {
  try {
    const item = await PlanItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// PUT /api/planner/:id
export async function updatePlanItem(req, res, next) {
  try {
    const item = await PlanItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return next(createError('Plan öğesi bulunamadı', 404));
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/planner/:id
export async function deletePlanItem(req, res, next) {
  try {
    const item = await PlanItem.findByIdAndDelete(req.params.id);
    if (!item) return next(createError('Plan öğesi bulunamadı', 404));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/planner/:id/toggle
export async function togglePlanItem(req, res, next) {
  try {
    const item = await PlanItem.findById(req.params.id);
    if (!item) return next(createError('Plan öğesi bulunamadı', 404));
    item.status = item.status === 'done' ? 'pending' : 'done';
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

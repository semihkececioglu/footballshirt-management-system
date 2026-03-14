import Sale from '../models/Sale.model.js';
import Purchase from '../models/Purchase.model.js';

export async function getMonthlyReport(req, res, next) {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [sales, purchases] = await Promise.all([
      Sale.find({ soldAt: { $gte: startDate, $lt: endDate } }).populate('jerseyId'),
      Purchase.find({ purchaseDate: { $gte: startDate, $lt: endDate } }).populate('seller'),
    ]);

    const totalRevenue = sales.reduce((s, sale) => s + sale.salePrice, 0);
    const totalCost = sales.reduce((s, sale) => s + (sale.buyPrice || 0), 0);

    const platformSummary = sales.reduce((acc, sale) => {
      const key = sale.platform || 'Diğer';
      if (!acc[key]) acc[key] = { count: 0, revenue: 0 };
      acc[key].count += 1;
      acc[key].revenue += sale.salePrice;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        year: Number(year),
        month: Number(month),
        sales,
        purchases,
        totalRevenue,
        totalCost,
        netProfit: totalRevenue - totalCost,
        totalSold: sales.length,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : 0,
        platforms: Object.entries(platformSummary).map(([platform, d]) => ({ platform, count: d.count, revenue: d.revenue })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAvailableReports(req, res, next) {
  try {
    const salesDates = await Sale.aggregate([
      { $group: { _id: { year: { $year: '$soldAt' }, month: { $month: '$soldAt' } } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    const byYear = salesDates.reduce((acc, { _id }) => {
      if (!acc[_id.year]) acc[_id.year] = [];
      acc[_id.year].push(_id.month);
      return acc;
    }, {});

    res.json({ success: true, data: byYear });
  } catch (err) {
    next(err);
  }
}

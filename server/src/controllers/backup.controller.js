import Jersey from '../models/Jersey.model.js';
import Sale from '../models/Sale.model.js';
import Purchase from '../models/Purchase.model.js';
import Seller from '../models/Seller.model.js';
import Wishlist from '../models/Wishlist.model.js';
import Reminder from '../models/Reminder.model.js';
import PlanItem from '../models/PlanItem.model.js';
import Settings from '../models/Settings.model.js';

export async function exportBackup(req, res, next) {
  try {
    const [jerseys, sales, purchases, sellers, wishlists, reminders, planItems, settings] =
      await Promise.all([
        Jersey.find(),
        Sale.find(),
        Purchase.find(),
        Seller.find(),
        Wishlist.find(),
        Reminder.find(),
        PlanItem.find(),
        Settings.find(),
      ]);

    const filename = `backup_${Date.now()}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      exportDate: new Date(),
      version: '1.0',
      data: { jerseys, sales, purchases, sellers, wishlists, reminders, planItems, settings },
    });
  } catch (err) {
    next(err);
  }
}

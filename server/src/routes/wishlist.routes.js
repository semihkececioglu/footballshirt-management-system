import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getWishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem,
  reorderWishlist, bulkDeleteWishlistItems, bulkCancelWishlistItems,
} from '../controllers/wishlist.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', getWishlist);
router.post('/', upload.single('image'), createWishlistItem);
router.put('/reorder', reorderWishlist);
router.delete('/bulk', bulkDeleteWishlistItems);
router.patch('/bulk-cancel', bulkCancelWishlistItems);
router.put('/:id', upload.single('image'), updateWishlistItem);
router.delete('/:id', deleteWishlistItem);
export default router;

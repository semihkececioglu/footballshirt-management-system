import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    image: String,
    imagePublicId: String,
    teamName: String,
    country: String,
    league: String,
    season: String,
    type: String,
    brand: String,
    targetPrice: Number,
    listingUrl: String,
    priority: { type: String, default: 'medium' },
    status: { type: String, enum: ['active', 'purchased', 'cancelled'], default: 'active' },
    notes: String,
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Wishlist', wishlistSchema);

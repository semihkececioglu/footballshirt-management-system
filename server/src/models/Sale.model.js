import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    jerseyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jersey' },
    teamName: String,
    season: String,
    type: String,
    brand: String,
    buyerName: String,
    buyerUsername: String,
    buyerPhone: String,
    platform: String,
    listingUrl: String,
    salePrice: { type: Number, required: true },
    buyPrice: { type: Number, default: 0 },
    paymentMethod: String,
    soldAt: { type: Date, default: Date.now, index: true },
    soldSize: String,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Sale', saleSchema);

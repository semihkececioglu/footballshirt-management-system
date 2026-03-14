import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    images: [{ url: String, publicId: String }],
    teamName: String,
    country: String,
    league: String,
    season: String,
    type: String,
    quality: String,
    brand: String,
    technology: String,
    sponsor: String,
    productCode: String,
    size: String,
    measurements: {
      armpit: Number,
      length: Number,
    },
    condition: String,
    printing: {
      hasNumber: { type: Boolean, default: false },
      number: String,
      playerName: String,
    },
    patches: [String],
    primaryColor: String,
    detailColor: String,
    buyPrice: { type: Number, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    platform: String,
    isForResale: { type: Boolean, default: false },
    linkedJerseyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jersey' },
    purchaseDate: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Purchase', purchaseSchema);

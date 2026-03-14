import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isMain: { type: Boolean, default: false },
  },
  { _id: false }
);

const sizeVariantSchema = new mongoose.Schema(
  {
    size: String,
    stockCount: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const platformSchema = new mongoose.Schema(
  {
    name: { type: String },
    listingUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const jerseySchema = new mongoose.Schema(
  {
    images: [imageSchema],
    teamName: { type: String, required: true, index: true },
    country: { type: String, index: true },
    league: { type: String, index: true },
    season: { type: String, index: true },
    type: String,
    quality: String,
    brand: String,
    technology: String,
    size: String,
    measurements: {
      armpit: Number,
      length: Number,
    },
    productCode: { type: String, index: true },
    sponsor: String,
    condition: String,
    printing: {
      hasNumber: { type: Boolean, default: false },
      number: String,
      playerName: String,
    },
    patches: [String],
    buyPrice: { type: Number, default: 0 },
    sellPrice: { type: Number, default: 0 },
    stockCount: { type: Number, default: 1, min: 0 },
    sizeVariants: [sizeVariantSchema],
    platforms: [platformSchema],
    status: {
      type: String,
      enum: ['for_sale', 'sold', 'not_for_sale'],
      default: 'for_sale',
      index: true,
    },
    primaryColor: String,
    detailColor: String,
    purchaseDate: Date,
    notes: String,
    tags: [String],
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

jerseySchema.index({ teamName: 'text', notes: 'text', tags: 'text' });

export default mongoose.model('Jersey', jerseySchema);

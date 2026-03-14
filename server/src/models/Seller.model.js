import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: String,
    phone: String,
    platforms: [
      {
        name: String,
        profileUrl: String,
        username: String,
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Seller', sellerSchema);

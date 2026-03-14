import mongoose from 'mongoose';

const planItemSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    type: { type: String, enum: ['share', 'list', 'photo', 'task'], required: true },
    title: { type: String, required: true },
    description: String,
    jerseyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jersey' },
    platform: String,
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('PlanItem', planItemSchema);

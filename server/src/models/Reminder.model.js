import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    contactName: { type: String, required: true },
    contactPhone: String,
    contactPlatforms: [{ name: String, username: String }],
    requestNote: String,
    image: String,
    imagePublicId: String,
    status: { type: String, enum: ['open', 'notified', 'closed'], default: 'open' },
    teamName: String,
    season: String,
    type: String,
  },
  { timestamps: true }
);

export default mongoose.model('Reminder', reminderSchema);

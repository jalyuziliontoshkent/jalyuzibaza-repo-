import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlock extends Document {
  name: string;
  description: string;
  priority: string;
  color: string;
}

const BlockSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  priority: { type: String, required: true },
  color: { type: String, required: true }
});

export const Block: Model<IBlock> = mongoose.models.Block || mongoose.model<IBlock>('Block', BlockSchema);

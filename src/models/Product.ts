import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  code: string;
  quantity: number;
  unit: string;
  block: string;
  location_note: string;
  costPrice: number;
  sellPrice: number;
  status: string;
  rollWidth?: number;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  block: { type: String, required: true },
  location_note: { type: String, required: true },
  costPrice: { type: Number, required: false, default: 0, min: 0 },
  sellPrice: { type: Number, required: false, default: 0, min: 0 },
  status: { type: String, required: false, default: 'omborda' },
  rollWidth: { type: Number, required: false, default: 0, min: 0 },
});

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

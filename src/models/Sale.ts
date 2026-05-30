import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISale extends Document {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  sellerName: string;
  note: string;
  date: string;
}

const SaleSchema: Schema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  sellerName: { type: String, required: true },
  note: { type: String, required: false, default: '' },
  date: { type: String, required: true },
});

export const Sale: Model<ISale> = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

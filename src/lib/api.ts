'use server';

import connectToDatabase from './mongoose';
import { Block } from '../models/Block';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';
import { revalidatePath } from 'next/cache';

// ─── BLOCKS ───────────────────────────────────────────────────────────────────

export async function getBlocks() {
  await connectToDatabase();
  const blocks = await Block.find({}).sort({ name: 1 }).lean();
  return JSON.parse(JSON.stringify(blocks));
}

export async function postBlock(payload: { name: string; description: string; priority: string; color: string }) {
  await connectToDatabase();
  const exists = await Block.findOne({ name: payload.name });
  if (exists) throw new Error(`"${payload.name}" nomli blok allaqachon mavjud`);
  const newBlock = new Block(payload);
  await newBlock.save();
  revalidatePath('/');
}

export async function putBlock(id: string, payload: { name?: string; description?: string; priority?: string; color?: string }) {
  await connectToDatabase();
  await Block.findByIdAndUpdate(id, payload, { new: true });
  revalidatePath('/');
}

export async function deleteBlock(id: string) {
  await connectToDatabase();
  const block = await Block.findById(id);
  if (block) {
    await Product.deleteMany({ block: block.name });
    await Block.findByIdAndDelete(id);
  }
  revalidatePath('/');
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export async function getProducts() {
  await connectToDatabase();
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products)).map((product: any) => ({
    ...product,
    price: product.price ?? 0,
  }));
}

export async function postProduct(payload: {
  name: string;
  code: string;
  quantity: number;
  unit: string;
  block: string;
  location_note: string;
  price: number;
}) {
  await connectToDatabase();
  const exists = await Product.findOne({ code: payload.code });
  if (exists) throw new Error(`"${payload.code}" kodli mahsulot allaqachon mavjud`);
  const newProduct = new Product({
    ...payload,
    quantity: Number(payload.quantity),
    price: Number(payload.price ?? 0),
  });
  await newProduct.save();
  revalidatePath('/');
}

export async function putProduct(id: string, payload: {
  name?: string;
  code?: string;
  quantity?: number;
  unit?: string;
  block?: string;
  location_note?: string;
  price?: number;
}) {
  await connectToDatabase();
  await Product.findByIdAndUpdate(id, { ...payload, quantity: Number(payload.quantity ?? 0), price: Number(payload.price ?? 0) }, { new: true });
  revalidatePath('/');
}

export async function deleteProduct(id: string) {
  await connectToDatabase();
  await Product.findByIdAndDelete(id);
  revalidatePath('/');
}

export async function bulkMoveProducts(from: string, to: string) {
  await connectToDatabase();
  await Product.updateMany({ block: from }, { block: to });
  revalidatePath('/');
}

// ─── SALES ────────────────────────────────────────────────────────────────────

export async function getSales() {
  await connectToDatabase();
  const sales = await Sale.find({}).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(sales));
}

export async function recordSale(productId: string, quantity: number, sellerName: string) {
  await connectToDatabase();
  const product = await Product.findById(productId);
  if (!product) throw new Error('Mahsulot topilmadi');
  if (product.quantity < quantity) throw new Error(`Omborda faqat ${product.quantity} ${product.unit} bor`);

  product.quantity -= quantity;
  await product.save();

  const newSale = new Sale({
    productId: product._id.toString(),
    productName: product.name,
    quantity,
    unit: product.unit,
    sellerName,
    date: new Date().toISOString(),
  });
  await newSale.save();
  revalidatePath('/');
}

export async function clearSales() {
  await connectToDatabase();
  await Sale.deleteMany({});
  revalidatePath('/');
}

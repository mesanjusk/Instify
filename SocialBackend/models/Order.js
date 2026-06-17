const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  order_uuid: { type: String, default: uuidv4, unique: true },
  order_id: { type: Number },
  institute_uuid: { type: String, required: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 },
    },
  ],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },
  address: { type: String },
  notes: { type: String },
  createdBy: { type: String },
  deliveredAt: { type: Date },
}, { timestamps: true });

orderSchema.index({ institute_uuid: 1, status: 1 });
orderSchema.index({ institute_uuid: 1, createdAt: -1 });

orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.order_id) {
    const last = await this.constructor.findOne(
      { institute_uuid: this.institute_uuid },
      {},
      { sort: { order_id: -1 } }
    );
    this.order_id = last?.order_id ? last.order_id + 1 : 1001;
  }
  if (this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

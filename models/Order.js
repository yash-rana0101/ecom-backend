import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String, // Changed from ObjectId to String to support both MongoDB IDs and API IDs
    required: true
  },
  productName: String,
  quantity: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'guest-user'
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);

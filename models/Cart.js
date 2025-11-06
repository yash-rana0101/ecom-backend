import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String, // Changed from ObjectId to String to support both MongoDB IDs and API IDs
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'guest-user'
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

cartSchema.methods.calculateTotal = function () {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.totalAmount;
};

export default mongoose.model('Cart', cartSchema);

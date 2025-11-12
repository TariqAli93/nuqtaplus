import bcrypt from 'bcryptjs';

/**
 * Hash password using bcrypt with salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If password is invalid
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 * @throws {Error} If inputs are invalid
 */
export async function comparePassword(password, hash) {
  if (!password || !hash) {
    throw new Error('Password and hash are required');
  }

  return bcrypt.compare(password, hash);
}

/**
 * Generate unique invoice number with timestamp and random suffix
 * @returns {string} Invoice number in format INV-{timestamp}-{random}
 */
export function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `INV-${timestamp}-${random}`;
}

/**
 * Calculate sale totals including discount and tax
 * @param {Array<Object>} items - Array of sale items with quantity and unitPrice
 * @param {number} discount - Discount amount (not percentage)
 * @param {number} tax - Tax percentage (0-100)
 * @returns {Object} Object containing subtotal, discount, tax, and total
 * @throws {Error} If inputs are invalid
 */
export function calculateSaleTotals(items, discount = 0, tax = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items must be a non-empty array');
  }

  if (discount < 0 || tax < 0) {
    throw new Error('Discount and tax must be non-negative');
  }

  if (tax > 100) {
    throw new Error('Tax percentage cannot exceed 100%');
  }

  // Calculate subtotal from all items
  const subtotal = items.reduce((sum, item) => {
    if (!item.quantity || !item.unitPrice) {
      throw new Error('Each item must have quantity and unitPrice');
    }
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // Apply discount
  const discountAmount = parseFloat(discount) || 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Calculate tax amount
  const taxAmount = (subtotalAfterDiscount * tax) / 100;

  // Calculate final total
  const total = subtotalAfterDiscount + taxAmount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discountAmount.toFixed(2)),
    tax: parseFloat(taxAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

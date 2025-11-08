import db, { saveDatabase } from '../db.js';
import { currencySettings, activityLogs } from '../models/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Currency Service
 * Handles currency settings and exchange rate management
 */

/**
 * Get all currencies
 */
export async function list() {
  const currencies = await db.select().from(currencySettings).all();
  return currencies;
}

/**
 * Get currency by code
 */
export async function getByCode(currencyCode) {
  const currency = await db
    .select()
    .from(currencySettings)
    .where(eq(currencySettings.currencyCode, currencyCode))
    .get();

  if (!currency) {
    throw new Error('Currency not found');
  }

  return currency;
}

/**
 * Update exchange rate
 */
export async function updateExchangeRate(currencyCode, newRate, userId) {
  const currency = await db
    .select()
    .from(currencySettings)
    .where(eq(currencySettings.currencyCode, currencyCode))
    .get();

  if (!currency) {
    throw new Error('Currency not found');
  }

  if (currency.isBaseCurrency) {
    throw new Error('Cannot update exchange rate for base currency');
  }

  const updated = await db
    .update(currencySettings)
    .set({
      exchangeRate: newRate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(currencySettings.currencyCode, currencyCode))
    .returning()
    .get();

  // Log activity
  await db.insert(activityLogs).values({
    userId,
    action: 'update',
    resource: 'currency',
    resourceId: updated.id,
    details: `Updated ${currencyCode} exchange rate to ${newRate}`,
    createdAt: new Date().toISOString(),
  });

  // Persist changes to disk
  saveDatabase();

  return updated;
}

/**
 * Update currency settings
 */
export async function update(currencyCode, data, userId) {
  const currency = await db
    .select()
    .from(currencySettings)
    .where(eq(currencySettings.currencyCode, currencyCode))
    .get();

  if (!currency) {
    throw new Error('Currency not found');
  }

  const updated = await db
    .update(currencySettings)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(currencySettings.currencyCode, currencyCode))
    .returning()
    .get();

  // Log activity
  await db.insert(activityLogs).values({
    userId,
    action: 'update',
    resource: 'currency',
    resourceId: updated.id,
    details: `Updated currency ${currencyCode}`,
    createdAt: new Date().toISOString(),
  });

  // Persist changes to disk
  saveDatabase();

  return updated;
}

/**
 * Get active currencies
 */
export async function getActiveCurrencies() {
  const currencies = await db
    .select()
    .from(currencySettings)
    .where(eq(currencySettings.isActive, true))
    .all();

  return currencies;
}

/**
 * Get base currency
 */
export async function getBaseCurrency() {
  const currency = await db
    .select()
    .from(currencySettings)
    .where(eq(currencySettings.isBaseCurrency, true))
    .get();

  return currency;
}

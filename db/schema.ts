import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { uuidv7 } from 'uuidv7';

const timestamps = {
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
};

export const buildings = sqliteTable('buildings', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  name: text('name').notNull().unique(),
  location_details: text('location_details'),
  ...timestamps,
});

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  cnic_number: text('cnic_number').notNull().unique(),
  name: text('name').notNull(),
  contact_no: text('contact_no').notNull(),
  cnic_expiry_date: text('cnic_expiry_date'),
  permanent_address: text('permanent_address'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  cnic_uri: text('cnic_uri'),
  ...timestamps
});

export const agreements = sqliteTable('agreements', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  tenant_id: text('tenant_id').references(() => tenants.id).notNull(),
  building_id: text('building_id').references(() => buildings.id).notNull(),
  move_in_date: text('move_in_date').notNull(),
  start_date: text('start_date').notNull(),
  end_date: text('end_date').notNull(),
  unit_number: text('unit_number').notNull(),
  advance_amount: integer('advance_amount').notNull(),
  monthly_rent: integer('monthly_rent').notNull(),
  rent_due_day: integer('rent_due_day').notNull(),
  attachment_uri: text('attachment_uri'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

export const ledgers = sqliteTable('ledgers', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  agreement_id: text('agreement_id').references(() => agreements.id).notNull(),
  tenant_id: text('tenant_id').references(() => tenants.id).notNull(),
  entry_type: text('entry_type').notNull(), // 'rent', 'k_electric', 'gas', 'water'
  billing_month: text('billing_month').notNull(), // e.g., '2026-07'
  total_payable_amount: integer('total_payable_amount').notNull(),
  amount_paid: integer('amount_paid').notNull().default(0),
  amount_due: integer('amount_due').notNull().default(0),
  status: text('status').notNull().default('pending'), // 'pending', 'partial', 'paid'
  ...timestamps,
});

export const misc_charges = sqliteTable('misc_charges', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  agreement_id: text('agreement_id').references(() => agreements.id).notNull(),
  charge_type: text('charge_type').notNull(), // e.g., 'Maintenance', 'Late Fine', 'Damage'
  amount: integer('amount').notNull(),
  description: text('description'),
  date_incurred: text('date_incurred').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' or 'paid'
  ...timestamps,
});

export const activity_logs = sqliteTable('activity_logs', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  tenant_id: text('tenant_id').references(() => tenants.id).notNull(),
  action_type: text('action_type').notNull(), // e.g., 'STATUS_CHANGE', 'DOCUMENT', 'FINANCE', 'SYSTEM'
  description: text('description').notNull(), // e.g., 'Tenant was deactivated', 'Agreement uploaded'
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  agreement_id: text('agreement_id').references(() => agreements.id).notNull(),
  ledger_id: text('ledger_id').references(() => ledgers.id),
  amount: integer('amount').notNull(),
  payment_method: text('payment_method').default('Cash').notNull(),
  ...timestamps,
});
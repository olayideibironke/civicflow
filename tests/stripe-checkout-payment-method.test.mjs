import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/20261020180000_allow_stripe_checkout_payment_method.sql', import.meta.url), 'utf8');
const webhook = readFileSync(new URL('../supabase/migrations/20261011050922_stripe_connect_checkout_foundation.sql', import.meta.url), 'utf8');

test('Stripe invoice webhook inserts stripe_checkout method', () => {
  assert.match(webhook, /insert into public\.billing_payments\s*\([\s\S]*?'succeeded',\s*'stripe_checkout',\s*'stripe'/i);
});

test('payment constraint permits every prior method and stripe_checkout', () => {
  const match = migration.match(/CHECK\s*\(\s*payment_method\s+IN\s*\(([^)]*)\)\s*\)/i);
  assert.ok(match, 'expected a payment_method IN check');
  const allowed = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]).sort();
  assert.deepEqual(allowed, ['manual', 'card', 'ach', 'check', 'cash', 'other', 'stripe_checkout'].sort());
});

test('compatibility migration does not modify existing payment rows', () => {
  assert.doesNotMatch(migration, /\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?(?:public\.)?billing_payments\b/i);
});

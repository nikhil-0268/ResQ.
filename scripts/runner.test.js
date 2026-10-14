import test from 'node:test';
import assert from 'node:assert/strict';
import { findAvailablePort } from './dev.mjs';

test('findAvailablePort resolves a free port above the preferred start', async () => {
  const port = await findAvailablePort(4175);
  assert.ok(port >= 4175);
  assert.ok(Number.isInteger(port));
});

import assert from 'node:assert/strict';
import { signPayload, verifyPayload } from './signature.ts';

/* 署名まわりの自己チェック（node --run test）
====================================================*/
const SECRET = 'test-secret';
const token = await signPayload(SECRET, { discordId: '123', hashedVerificationCode: 'hash' }, 60);
const [payload, signature] = token.split('.');

// 往復できる
const restored = await verifyPayload<{ discordId: string; hashedVerificationCode: string }>(SECRET, token);
assert.equal(restored?.discordId, '123');
assert.equal(restored?.hashedVerificationCode, 'hash');

// ペイロード改竄を弾く（discordIdを差し替えて他人にロールを付けられないこと）
const tampered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), discordId: '999' })).toString('base64url');
assert.equal(await verifyPayload(SECRET, `${tampered}.${signature}`), null);

// 鍵違い・署名欠損・期限切れを弾く
assert.equal(await verifyPayload('other-secret', token), null);
assert.equal(await verifyPayload(SECRET, payload), null);
assert.equal(await verifyPayload(SECRET, await signPayload(SECRET, { discordId: '123' }, -1)), null);

console.log('signature: ok');

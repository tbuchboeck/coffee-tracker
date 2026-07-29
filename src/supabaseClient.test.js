import { withAuthToken, SUPABASE_JWT_KEY } from './supabaseClient';

describe('withAuthToken (PostgREST auth-header injection)', () => {
  const base = { apikey: 'anon-key', Authorization: 'Bearer anon-key' };

  test('upgrades Authorization to the user JWT, keeps apikey (plain object)', () => {
    const out = withAuthToken({ ...base }, 'USER.JWT.TOKEN');
    expect(out.Authorization).toBe('Bearer USER.JWT.TOKEN');
    expect(out.apikey).toBe('anon-key');
  });

  test('no JWT ⇒ headers returned unchanged (identical to old bare-anon behaviour)', () => {
    const headers = { ...base };
    expect(withAuthToken(headers, null)).toBe(headers);
    expect(withAuthToken(headers, undefined)).toBe(headers);
    expect(withAuthToken(headers, '')).toBe(headers);
  });

  test('handles a Headers instance', () => {
    const h = new Headers(base);
    const out = withAuthToken(h, 'JWT');
    expect(out.get('Authorization')).toBe('Bearer JWT');
    expect(out.get('apikey')).toBe('anon-key');
  });

  test('tolerates missing headers object', () => {
    expect(withAuthToken(undefined, 'JWT')).toEqual({ Authorization: 'Bearer JWT' });
  });

  test('storage key matches the one authService writes', () => {
    expect(SUPABASE_JWT_KEY).toBe('coffee.supabase.jwt.v1');
  });
});

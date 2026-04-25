import { PolyglotClient } from '../src/client';
import fs from 'fs';

describe('PolyglotClient cache', () => {
  it('caches fallback when translation fails', async () => {
    const client = new PolyglotClient();
    const cachePath = '/tmp/polyglot-cache-fallback.json';
    const stringId = 'FAILED_TRANSLATION';
    const fallback = 'Failed translation';
    const request = jest.fn().mockRejectedValue(new Error('offline'));

    await fs.promises.writeFile(cachePath, '{}');
    await client.init({
      token: 'test-token',
      productId: 'test-product',
      languages: ['en', 'ru'],
      region: 'us-east-1',
      cachePath,
    });

    //@ts-expect-error
    client.request = request;

    expect(
      await client.getOrTranslate('ru', fallback, 'Fallback cache test', stringId)
    ).toBe(fallback);
    expect(request).toHaveBeenCalledTimes(2);

    expect(
      await client.getOrTranslate('ru', fallback, 'Fallback cache test', stringId)
    ).toBe(fallback);
    expect(request).toHaveBeenCalledTimes(2);

    //@ts-expect-error
    expect(client.cache[stringId]?.translations['ru'].value).toBe(fallback);
  });
});

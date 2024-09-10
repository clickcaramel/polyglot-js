import { polyglotClient, PolyglotClient } from '../src/client';
import { Language } from '../src/localisation';
import fs from 'fs';

const productId = 'test.ai.boost';

function clearDb(strings: string[]) {
  //@ts-expect-error
  return Promise.all(strings.map((str) => polyglotClient.request(
    `products/${productId}/strings/${str}`,
    'DELETE',
  )));
}

describe('PolyglotClient', () => {
  const token = 'f233f89a-7868-4e53-854c-9fa60f5b283e';
  const languages: Partial<Language>[] = ['en', 'pt-BR', 'ru'];
  const apiUrl = 'https://api.dev.polyglot.rocks';

  beforeAll(async () => {
    await Promise.all(fs.readdirSync('/tmp').map(async (file) => {
      if (file.startsWith('polyglot-cache')) {
        await fs.promises.unlink(`/tmp/${file}`);
      }
    }));
    await polyglotClient.init({
      token,
      productId,
      languages,
      languageAliases: { 'pt': 'pt-BR', },
      apiUrl,
      cachePath: '/tmp/polyglot-cache-1.json',
    });
  });

  it('failed to init client with invalid token', async () => {
    const testClient = new PolyglotClient();
    await expect(testClient.init({
      token: 'NONE',
      productId,
      languages,
      cachePath: '/tmp/polyglot-cache-2.json',
    })).rejects.toThrow();
  });

  it('get or translate 1 string to 1 language', async () => {
    const firstStrId = 'Crop';
    const secStrId = 'BTN_SHARE';
    await clearDb([firstStrId, secStrId]);

    expect(['Обрезать', 'Обрезка']).toContain(
      await polyglotClient.getOrTranslate('ru', firstStrId, 'Image processing tool')
    );

    expect(
      await polyglotClient.getOrTranslate('ru', 'Share', 'Mobile app', secStrId)
    ).toBe('Поделиться');

    //@ts-expect-error
    expect(polyglotClient.cache[secStrId]?.translations['ru'].value).toBe('Поделиться');

    expect(await polyglotClient.getTranslation('id', firstStrId)).toBe(firstStrId);
    expect(['Обрезать', 'Обрезка']).toContain(
      await polyglotClient.getTranslation('ru', firstStrId)
    );
    expect(await polyglotClient.getTranslation('ru', secStrId)).toBe('Поделиться');

    const testClient = new PolyglotClient();
    await testClient.init({
      token,
      productId,
      languages,
      preload: true,
      apiUrl,
      cachePath: '/tmp/polyglot-cache-2.json',
    });

    expect(await testClient.getTranslationFromCache('ru', secStrId)).toBe('Поделиться');

    const diskCacheClient = new PolyglotClient();
    await diskCacheClient.init({
      token,
      productId,
      languages,
      preload: true,
      apiUrl,
      cachePath: '/tmp/polyglot-cache-2.json',
    });
    expect(await diskCacheClient.getTranslationFromCache('ru', secStrId)).toBe('Поделиться');
  });

  it('try to get the string that not translated yet', async () => {
    expect(
      await polyglotClient.getTranslation('ru', 'NOT_EXISTS')
    ).toBe('NOT_EXISTS');
  });

  it('try to get the string that not translated yet', async () => {
    expect(
      await polyglotClient.getTranslation('ru', 'NOT_EXISTS')
    ).toBe('NOT_EXISTS');

    //@ts-expect-error
    polyglotClient.baseStringAsFallback = false;
    expect(
      await polyglotClient.getTranslation('ru', 'NOT_EXISTS')
    ).toBeUndefined();
    //@ts-expect-error
    polyglotClient.baseStringAsFallback = true;
  });

  it('check is string has translation', async () => {
    await clearDb(['4K']);

    expect(
      await polyglotClient.hasTranslation('ru', '4K')
    ).toBe(false);

    expect(
      await polyglotClient.getOrTranslate('pt-BR', '4K', 'Online player')
    ).toBe('4K');

    expect(
      await polyglotClient.hasTranslation('pt-BR', '4K')
    ).toBe(true);

    //@ts-expect-error
    delete polyglotClient.cache['4K'];

    expect(
      await polyglotClient.hasTranslation('pt-BR', '4K', true)
    ).toBe(true);
  });

  it('use language aliases', async () => {
    const secStrId = 'BTN_SHARE';
    await clearDb([secStrId]);

    expect(
      await polyglotClient.getOrTranslate('pt', 'Share', 'Mobile app', secStrId)
    ).toBe('Compartilhar');

    expect(
      await polyglotClient.hasTranslation('pt', secStrId)
    ).toBe(true);

    expect(
      await polyglotClient.hasTranslation('pt-BR', secStrId)
    ).toBe(true);
  });
});

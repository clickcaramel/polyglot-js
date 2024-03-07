import { Logger } from './logger';
import { Localisation, Language, Translation } from './localisation';

interface CommonParams {
  baseStringAsFallback?: boolean,
}

export interface PolyglotConfig extends CommonParams {
  token: string,
  productId: string,
  languages: Language[],
  preload?: boolean,
  languageAliases?: Partial<Record<Language, Language>>,
  apiUrl?: string,
}

export interface TranslationParams extends CommonParams {
  desiredMaxLength?: number,
}

type CachedLocalisation = Omit<Localisation, 'stringId'> & { stringId?: string } ;

export class PolyglotClient {
  private logger = new Logger('PolyglotClient');
  private apiUrl = '';
  private readonly baseLanguage = 'en';
  private token = '';
  private productId = '';
  private languages!: Set<Language>;
  private baseStringAsFallback = true;
  private cache: Record<string, CachedLocalisation> = {};
  private cacheFromDb!: Promise<Record<string, CachedLocalisation>>;
  private languageAliases!: Partial<Record<Language, Language>>;

  async init(config: PolyglotConfig) {
    if (this.token) {
      if (config.preload) {
        this.downloadTranslationsIfNeed();
      }

      return;
    }

    this.token = config.token;
    this.productId = config.productId;
    this.languageAliases = config.languageAliases ?? {};
    this.languages = new Set(config.languages);
    this.baseStringAsFallback = config.baseStringAsFallback ?? true;
    this.apiUrl = config.apiUrl ?? 'https://api.polyglot.rocks';

    await this.request(
      `products/${this.productId}`,
      'PUT',
      { languages: config.languages },
    );

    if (config.preload) {
      this.downloadTranslationsIfNeed();
    }
  
    this.logger.info('Initialization was successful!');
  }

  private downloadTranslationsIfNeed() {
    if (this.cacheFromDb !== undefined) {
      return;
    }

    this.logger.info('Downloading translations from the server');
    this.cacheFromDb = this.request(`products/${this.productId}/strings`)
      .then((strings: CachedLocalisation[]) => {
        this.logger.info(`Loaded translations for ${strings.length} strings`);
        return strings.reduce<Record<string, CachedLocalisation>>((acc, item) => {
          acc[item.stringId as string] = item;
          delete item.stringId;
          return acc;
        }, {});
      })
      .catch(
        (e) => (this.logger.error('Failed to get translations', e), {})
      );
  }

  async hasTranslation(
    language: Language,
    stringId: string,
    isTranslatedBefore = false,
  ): Promise<boolean> {
    const finalLanguage = this.languageAliases[language] ?? language;

    if (finalLanguage === this.baseLanguage) {
      return true;
    }

    const isInCache = (await this.getTranslationFromCache(
      finalLanguage, stringId
    )) !== undefined;

    return (
      isInCache || (
        isTranslatedBefore &&
        (await this.getTranslation(finalLanguage, stringId) !== undefined)
      )
    );
  }

  async getTranslation(
    language: Language,
    stringId: string,
  ): Promise<string | undefined> {
    return this.doGetOrTranslate(false, language, stringId);
  }

  async getOrTranslate(
    language: Language,
    initString: string,
    description: string | undefined,
    stringId = initString,
    params?: TranslationParams
  ): Promise<string | undefined> {
    return this.doGetOrTranslate(
      true, language, initString, description, stringId, params
    );
  }

  private async getTranslationFromCache(
    language: Language,
    stringId: string,
  ): Promise<string | undefined> {
    const finalLanguage = this.languageAliases[language] ?? language;

    return (
      this.cache[stringId]?.translations[finalLanguage]?.value ||
      (
        this.cacheFromDb !== undefined ?
          (await this.cacheFromDb)[stringId]?.translations[finalLanguage]?.value :
          undefined
      )
    );
  }

  private async doGetOrTranslate(
    needToTranslate: boolean,
    language: Language,
    initString: string,
    description?: string,
    stringId = initString,
    params?: TranslationParams,
  ): Promise<string | undefined> {
    const finalLanguage = this.languageAliases[language] ?? language;

    if (finalLanguage === this.baseLanguage) {
      return initString;
    }

    const baseStringAsFallback = params?.baseStringAsFallback ?? this.baseStringAsFallback;
    const translationFromCache = await this.getTranslationFromCache(
      finalLanguage, stringId
    );

    if (translationFromCache) {
      return translationFromCache;
    }

    if (!this.languages.has(finalLanguage)) {
      return baseStringAsFallback ? initString : undefined;
    }

    // in the future, it may be added to get translation into multiple languages at once
    const urlSuffix = '/translations/' + finalLanguage;
    const encodedStrId = encodeURIComponent(stringId);
    const getResponse = await this.request(
      `products/${this.productId}/strings/${encodedStrId}${urlSuffix}`
    ).catch(() => undefined) as Translation | undefined;

    if (getResponse !== undefined || needToTranslate === false) {
      const translation = getResponse?.translation;

      if (translation) {
        this.cache[stringId] = {
          translations: {
            [finalLanguage]: { value: translation },
          }
        };
      }

      return translation ?? (baseStringAsFallback ? initString : undefined);
  }

    this.logger.info(`Getting auto-translations for ${stringId}`);

    const response = await this.request(
      `products/${this.productId}/strings/${encodedStrId}`,
      'PUT',
      {
        translations: {
          [this.baseLanguage]: initString,
        },
        description,
      }
    ).catch(
      (e) => this.logger.error('Failed to get translation.', e)
    ) as Localisation | undefined;

    if (response === undefined) {
      return baseStringAsFallback ? initString : undefined;
    }

    delete (response as CachedLocalisation).stringId;
    this.cache[stringId] = response;

    return response.translations[finalLanguage]?.value;
  }

  private async request(
    path: string,
    method = 'GET',
    data?: Record<string, unknown>,
    options?: RequestInit,
  ) {
    const ucMethod = method.toUpperCase();
    const defaultOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    };

    if (ucMethod === 'POST' || ucMethod === 'PUT' || ucMethod === 'PATCH') {
      defaultOptions.body = JSON.stringify(data);
      (defaultOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    return fetch(
      `${this.apiUrl}/` + path,
      options === undefined ? defaultOptions : Object.assign(defaultOptions, options)
    ).then(async (r) => {
      if (r.ok && r.status >= 200 && r.status < 400) {
        return r.json();
      }

      throw new Error(`Invalid response: ${r.status} ${await r.text()}`);
    });
  }
}

export const polyglotClient = new PolyglotClient();

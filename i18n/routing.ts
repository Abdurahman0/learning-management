import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uz', 'en'],
  defaultLocale: 'uz',
  localePrefix: 'always'
});

export type AppLocale = (typeof routing.locales)[number];


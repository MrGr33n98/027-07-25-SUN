import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/test-auth/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/test-auth/',
          '/private/',
        ],
      },
    ],
    sitemap: 'https://solarconnect.com.br/sitemap.xml',
  }
}
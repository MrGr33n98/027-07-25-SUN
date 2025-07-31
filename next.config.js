/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['localhost', 'uploadthing.com'],
        formats: ['image/webp', 'image/avif'],
    },
    async rewrites() {
        return [{
            source: '/empresa/:slug',
            destination: '/company/:slug',
        }, ]
    },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {        
        remotePatterns: [
            { 
            protocol: 'https',
            hostname: 'maps.googleapis.com',
            },
        ],
    },
};


export default nextConfig;

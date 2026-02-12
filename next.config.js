/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['docx', 'archiver'],
  output: 'standalone',
};

module.exports = nextConfig;

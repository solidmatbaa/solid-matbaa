const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://gncohtnoqlvdfuzqyyk.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "هنا_ضع_مفتاح_الـ_anon_الذي_نسخته",
    SUPABASE_SERVICE_ROLE_KEY: "هنا_ضع_مفتاح_الـ_service_role_الذي_يبدأ_بـ_ey",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};
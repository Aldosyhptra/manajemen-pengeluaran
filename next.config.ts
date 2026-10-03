import type { NextConfig } from "next";

const nextConfig: NextConfig & { agentRules?: false } = {
  agentRules: false,
};

export default nextConfig;

/** Read `process.env` at runtime. Static `process.env.NAME` is inlined at build and empties Vercel Secrets. */
export function runtimeEnv(name: string): string | undefined {
  const value = process.env[name]
  return value ? value : undefined
}

import { discover } from '@/lib/testnet';
let cached: Awaited<ReturnType<typeof discover>> | null = null;
let pending: ReturnType<typeof discover> | null = null;
export async function GET() {
  try {
    if (cached && Date.now() - Date.parse(cached.observedAt) < 30000)
      return Response.json(cached, {
        headers: { 'Cache-Control': 'no-store' },
      });
    pending ??= discover(8);
    cached = await pending;
    return Response.json(cached, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error ? e.message.split('\n')[0] : 'Testnet read failed',
      },
      { status: 503 },
    );
  } finally {
    pending = null;
  }
}

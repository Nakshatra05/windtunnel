import { config } from 'dotenv';
import { appendFileSync } from 'node:fs';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { exchange, publicClient, TESTNET_CHAIN } from '../lib/testnet';
import { createWalletClient, http, erc20Abi, type Hex } from 'viem';
import { SOMNIA_TESTNET_ADDRESSES } from '@somnia-chain/markets-sdk';
config({ path: '.env.local', quiet: true });
const key = process.env.PRIVATE_KEY;
if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key))
  throw Error('Configure a 32-byte testnet PRIVATE_KEY in ignored .env.local.');
export const owner = privateKeyToAccount(key as Hex);
if (
  process.env.EXPECTED_WALLET &&
  owner.address.toLowerCase() !== process.env.EXPECTED_WALLET.toLowerCase()
)
  throw Error(
    'Signing key does not match EXPECTED_WALLET. No transaction was sent.',
  );
export const pub = publicClient();
export const token = SOMNIA_TESTNET_ADDRESSES.testUsdc!;
export const ex = exchange(key as Hex);
export const ownerWallet = createWalletClient({
  account: owner,
  chain: TESTNET_CHAIN,
  transport: http(),
});
export const ONE = 1000000n;
export const balances = async (address: Hex) => ({
  native: await pub.getBalance({ address }),
  collateral: await pub.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  }),
});
export function fixtureMaker() {
  let k = process.env.FIXTURE_MAKER_KEY as Hex | undefined;
  if (!k) {
    k = generatePrivateKey();
    appendFileSync('.env.local', `\nFIXTURE_MAKER_KEY=${k}\n`);
  }
  return { account: privateKeyToAccount(k), exchange: exchange(k) };
}

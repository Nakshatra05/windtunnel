import { referenceStrategy } from '../lib/engine';
// Replace this reducer with your own ledger implementation. Runs locally only.
export default { ...referenceStrategy('repaired'), name: 'example-strategy' };

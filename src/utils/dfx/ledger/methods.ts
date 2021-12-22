/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */
import { ActorSubclass } from '@dfinity/agent';

import LedgerService, { TimeStamp } from '../../../interfaces/ledger';
import { Balance } from '../token/methods';
import { BaseMethodsExtendedActor } from '../actorFactory';
import { parseAmountToSend } from '../token/methods';

const DECIMALS = 8;

export interface SendOpts {
  fee?: bigint;
  memo?: string;
  from_subaccount?: number;
  created_at_time?: TimeStamp; // TODO: create js Date to TimeStamp function
}

interface SendICPArgs {
  to: string;
  amount: string;
  opts?: SendOpts;
}

type BaseLedgerService = BaseMethodsExtendedActor<LedgerService>
export interface LedgerServiceExtended extends BaseLedgerService {
  sendICP: (args_0: SendICPArgs) => Promise<string>;
  getBalance: (accountId: string) => Promise<Balance>;
}

const sendICP = async (
  actor: ActorSubclass<BaseLedgerService>,
  args: SendICPArgs
): Promise<bigint> => {
  const { to, amount, opts } = args;
  const defaultArgs = {
    fee: BigInt(10000),
    memo: BigInt(0),
  };
  const parsedAmount = parseAmountToSend(amount, DECIMALS);
  return actor._send_dfx({
    to,
    fee: { e8s: opts?.fee || defaultArgs.fee },
    amount: { e8s: parsedAmount },
    memo: opts?.memo ? BigInt(opts.memo) : defaultArgs.memo,
    from_subaccount: [] as [], // For now, using default subaccount to handle ICP
    created_at_time: [] as [],
  });
};

const getBalance = async (
  actor: ActorSubclass<BaseLedgerService>,
  accountId: string
): Promise<Balance> => {
  const balance = await actor._account_balance_dfx({ account: accountId });
  return { value: balance.e8s.toString(), decimals: DECIMALS };
};

export default { sendICP, getBalance };

/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import crossFetch from 'cross-fetch';
import axios, { AxiosResponse } from 'axios';
import { Principal } from '@dfinity/principal';
import { prettifyCapTransactions } from '@psychedelic/cap-js';
import { getTokens, getAllNFTS, TokenRegistry } from '@psychedelic/dab-js';

import { recursiveParseBigint } from '../../object';
import { InferredTransaction } from './rosetta';
import { PLUG_PROXY_HOST } from '../constants';
import { getCanisterInfo } from '../../dab';
import { parseBalance } from '../token';
import { createAgent } from '..';
import { HttpAgent } from '@dfinity/agent';

const KYASHU_URL = 'https://kyasshu.fleek.co';

interface KyashuItem {
  contractId: string;
  event: any;
  pk: string;
  sk: string;
  userId: string;
  gs1sk: string;
  gs1pk: string;
  caller: Principal;
}

interface LastEvaluatedKey {
  pk: string;
  sk: string;
  userId: string;
}

interface KyashuResponse {
  Count: number;
  Items: KyashuItem[];
  LastEvaluatedKey: LastEvaluatedKey;
}

export interface GetUserTransactionResponse {
  total: number;
  transactions: InferredTransaction[];
  lastEvaluatedKey?: LastEvaluatedKey;
}

const parsePrincipal = pidObj =>
  pidObj?._isPrincipal
    ? Principal.fromUint8Array(
        new Uint8Array(Object.values((pidObj as any)._arr))
      ).toString()
    : pidObj;

const getTransactionCanister = (contract: string): string | undefined =>
  contract?.split('#')?.[1];

function lebDecode(pipe) {
  let weight = BigInt(1);
  let value = BigInt(0);
  let byte;
  do {
    if (pipe.length < 1) {
      throw new Error('unexpected end of buffer');
    }
    byte = pipe[0];
    pipe = pipe.slice(1);
    value += BigInt(byte & 0x7f).valueOf() * weight;
    weight *= BigInt(128);
  } while (byte >= 0x80);
  return value;
}

const parseBySymbol = (amount: bigint, symbol: string): string => {
  switch (symbol) {
    case 'WICP':
      return parseBalance({ value: amount.toString(), decimals: 8 });
    default:
      return amount.toString();
  }
};

const formatTransaction = async (
  transaction: any,
  sk: string,
  contractId: string,
  canistersInfo,
  fetch
): Promise<InferredTransaction> => {
  const canisterId = getTransactionCanister(contractId);
  const agent = new HttpAgent({ fetch, host: PLUG_PROXY_HOST });
  const { time, operation, details, caller } = transaction;
  const symbol = transaction?.details?.['tokenRegistryInfo']?.symbol;
  const amount = details?.amount;
  const parsedAmount =
    amount instanceof Array && !amount.some(value => typeof value !== 'number')
      ? lebDecode(Uint8Array.from(amount as Array<number>))
      : amount;
  const tokenId = details?.tokenId || details?.token || details?.token_id || '';
  const isSonicTransaction = canisterId === '3xwpq-ziaaa-aaaah-qcn4a-cai';

  const getHandledTokenInfo = async principal => {
    if (!principal) return;
    const canisterId = parsePrincipal(principal);
    if (canistersInfo[canisterId]?.tokenRegistryInfo)
      return canistersInfo[canisterId]?.tokenRegistryInfo;
    else {
      const registry = new TokenRegistry(agent);
      const data = await registry.get(canisterId);
      return data;
    }
  };

  const buildSonicData = async () => {
    const isSwap = operation?.toLowerCase?.()?.includes?.('swap');
    let data: any = {
      token: await getHandledTokenInfo(tokenId),
      amount: amount,
    };
    if (isSwap) {
      data.swap = {
        from: await getHandledTokenInfo(details?.from),
        to: await getHandledTokenInfo(details?.to),
        amountIn: details?.amountIn,
        amountOut: details?.amountOut,
      };
    }
    return data;
  };

  return recursiveParseBigint({
    hash: sk,
    timestamp: time,
    type: operation,
    details: {
      details,
      amount:
        parsedAmount && symbol ? parseBySymbol(parsedAmount, symbol) : amount,
      canisterId,
      tokenId,
      to: parsePrincipal(details?.to),
      from: parsePrincipal(details?.from),
      ...(isSonicTransaction ? { sonicData: await buildSonicData() } : {}),
    },
    caller: parsePrincipal(caller) || '',
  });
};

const reduceByPID = (acum, token) => ({
  ...acum,
  [token.principal_id.toString()]: token,
});

export const getCapTransactions = async ({
  principalId,
  lastEvaluatedKey,
  fetch,
}: {
  principalId: string;
  lastEvaluatedKey?: string;
  fetch?: typeof crossFetch;
}): Promise<GetUserTransactionResponse> => {
  const url = `${KYASHU_URL}/cap/user/txns/${principalId}${
    lastEvaluatedKey ? `?LastEvaluatedKey=${lastEvaluatedKey}` : ''
  }`;
  try {
    const response = await axios.get<any, AxiosResponse<KyashuResponse>>(url);
    const canisterIds = [
      ...new Set(
        response.data.Items.map(item => getTransactionCanister(item.contractId))
      ),
    ].filter(value => value) as string[];
    const agent = await createAgent({ fetch });
    const dabTokensInfo = (await getTokens({ agent })).reduce(reduceByPID, {});
    const dabNFTsInfo = (await getAllNFTS({ agent })).reduce(reduceByPID, {});
    const dabInfo = await Promise.all(
      canisterIds.map(async canisterId => {
        let canisterInfo = { canisterId };
        if (dabTokensInfo[canisterId])
          canisterInfo['tokenRegistryInfo'] = dabTokensInfo[canisterId];
        if (dabNFTsInfo[canisterId])
          canisterInfo['nftRegistryInfo'] = dabNFTsInfo[canisterId];
        try {
          const fetchedCanisterInfo = await getCanisterInfo({
            canisterId,
            fetch,
          });
          canisterInfo = { ...canisterInfo, ...fetchedCanisterInfo };
        } catch (error) {
          /* eslint-disable-next-line */
          console.error('DAB error: ', error);
        }
        return canisterInfo;
      })
    );
    const canistersInfo = dabInfo.reduce(
      (acum, info) => ({ ...acum, [info.canisterId]: info }),
      {}
    );
    const transactions = await Promise.all(
      response.data.Items.map(item => {
        const canisterId = getTransactionCanister(item.contractId);
        const prettifyEvent = prettifyCapTransactions(item.event);
        if (canisterId)
          prettifyEvent['details'] = {
            ...prettifyEvent['details'],
            ...canistersInfo[canisterId],
          };
        const formattedTx = formatTransaction(
          prettifyEvent,
          item.sk,
          item.contractId,
          canistersInfo,
          fetch
        );
        return formattedTx;
      })
    );
    return {
      total: response.data.Count,
      lastEvaluatedKey: response.data.LastEvaluatedKey,
      transactions: transactions,
    };
  } catch (e) {
    console.error('CAP transactions error:', e);
    return {
      total: 0,
      transactions: [],
    };
  }
};

export default {};

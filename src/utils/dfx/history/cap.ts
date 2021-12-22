/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import axios, { AxiosResponse } from 'axios';
import { Principal } from '@dfinity/principal';
import {
  prettifyCapTransactions,
  TransactionPrettified,
} from '@psychedelic/cap-js';
import crossFetch from 'cross-fetch';
import {
  getTokens,
  getAllNFTS
} from '@psychedelic/dab-js';
import { bufToBigint } from 'bigint-conversion'

import { getCanisterInfo } from '../../dab';
import { InferredTransaction } from './rosetta';
import { parseBalance } from '../token';

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
  switch(symbol) {
    case 'WICP':
      return parseBalance({value: amount.toString(), decimals: 8});
    default:
      return amount.toString();
  }
}

const formatTransaction = (
  transaction: any,
  sk: string,
  contractId: string
): InferredTransaction => {
  const amount = transaction.details?.amount
  const parsedAmount = amount instanceof Array && !amount.some(value => typeof value !== 'number') ? lebDecode(Uint8Array.from(amount as Array<number>)) : amount;
  const symbol = transaction?.details?.['tokenRegistryInfo']?.symbol;
  return {
    hash: sk,
    timestamp: transaction.time,
    type: transaction.operation,
    details: {
      ...transaction.details,
      amount: parsedAmount && symbol ? parseBySymbol(parsedAmount, symbol) : amount,
      canisterId: getTransactionCanister(contractId),
      tokenId: transaction.details?.token_id || transaction.details?.token || '',
      to: parsePrincipal(transaction?.details?.to),
      from: parsePrincipal(transaction?.details?.from),
    },
    caller: parsePrincipal(transaction.caller) || '',
  }
};

export const getCapTransactions = async ({
  principalId,
  lastEvaluatedKey,
  fetch,
} :{
  principalId: string,
  lastEvaluatedKey?: string,
  fetch?: typeof crossFetch
}): Promise<GetUserTransactionResponse> => {
  const url = `${KYASHU_URL}/cap/user/txns/${principalId}${lastEvaluatedKey ? `?LastEvaluatedKey=${lastEvaluatedKey}` : ''
    }`;
  try {
    const response = await axios.get<any, AxiosResponse<KyashuResponse>>(url);
    const canisterIds = [
      ...new Set(
        response.data.Items.map(item => getTransactionCanister(item.contractId))
      ),
    ].filter(value => value) as string[];
    const dabTokensInfo = (await getTokens({})).reduce((acum, token) => ({ ...acum, [token.principal_id.toString()]: token }), {})
    const dabNFTsInfo = (await getAllNFTS({})).reduce((acum, token) => ({ ...acum, [token.principal_id.toString()]: token }), {})
    const dabInfo = await Promise.all(
      canisterIds.map(async canisterId => {
        let canisterInfo = { canisterId }
        if (dabTokensInfo[canisterId])
          canisterInfo['tokenRegistryInfo'] = dabTokensInfo[canisterId]
        if (dabNFTsInfo[canisterId])
          canisterInfo['nftRegistryInfo'] = dabNFTsInfo[canisterId]
        try {
          const fetchedCanisterInfo = await getCanisterInfo({ canisterId, fetch });
          canisterInfo = { ...canisterInfo, ...fetchedCanisterInfo }
        } catch (error) {
          /* eslint-disable-next-line */
          console.error("DAB error: ", error);
        }
        return canisterInfo;
      })
    );
    const canistersInfo = dabInfo.reduce(
      (acum, info) => ({ ...acum, [info.canisterId]: info }),
      {}
    );
    const transactions = response.data.Items.map(item => {
      const canisterId = getTransactionCanister(item.contractId);
      const prettifyEvent = prettifyCapTransactions(item.event)
      if(canisterId) prettifyEvent['details'] = {...prettifyEvent['details'], ...canistersInfo[canisterId]}
      const formattedTx = formatTransaction(
        prettifyEvent,
        item.sk,
        item.contractId
      );
      return formattedTx;
    });
    return {
      total: response.data.Count,
      lastEvaluatedKey: response.data.LastEvaluatedKey,
      transactions,
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

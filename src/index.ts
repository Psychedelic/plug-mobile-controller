import PlugKeyRing from './PlugKeyRing';
import { getAccountId } from './utils/account';
import { getCanisterInfo, getMultipleCanisterInfo } from './utils/dab';
import { encode, decode } from './utils/IDL';

export default {
  PlugKeyRing,
  getAccountId,
  getCanisterInfo,
  getMultipleCanisterInfo,
  IDLEncode: encode,
  IDLDecode: decode,
};

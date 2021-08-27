/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import RandomBigInt from 'random-bigint';
import { Principal } from '@dfinity/principal';

import PlugKeyRing from '.';
import { ERRORS } from '../errors';
import { GetTransactionsResponse } from '../utils/dfx/history/rosetta';
import PlugWallet from '../PlugWallet';
import { createAgent } from '../utils/dfx';
import store from '../utils/storage/mock';
import { getAccountId } from '../utils/account';
import { TOKENS } from '../constants/tokens';

const mockSendICP = jest.fn();

jest.mock('../utils/dfx', () => {
  return {
    createAgent: jest.fn(() => ({})),
    createLedgerActor: (): { sendICP: jest.Mock<any, any> } => ({
      sendICP: mockSendICP,
    }),
  };
});

jest.mock('../utils/dfx/token', () => {
  return {
    createTokenActor: (): { getMetadata: jest.Mock<any, any> } => ({
      getMetadata: jest.fn(() => ({
        fungible: { symbol: 'WTC', decimals: 5, name: 'Wrapped Cycles' },
      })),
    }),
  };
});

jest.mock('../utils/dfx/nft', () => {
  return {
    createNFTActor: (): {
      user_tokens: jest.Mock<any, any>;
      data_of: jest.Mock<any, any>;
      transfer_to: jest.Mock<boolean, any>;
    } => ({
      user_tokens: jest.fn(() => [BigInt(10)]),
      data_of: jest.fn(() => ({
        id: BigInt(10),
        url: '/Token/10',
        owner: [
          'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
        ],
        desc: 'Example description of ICPunk',
        name: 'ICPunk #10',
        properties: [],
      })),
      transfer_to: jest.fn((_, id) => {
        if (id === BigInt(130)) {
          throw new Error(ERRORS.TRANSFER_NFT_ERROR);
        }
        return true;
      }),
    }),
  };
});

jest.mock('../utils/dfx/token/methods', () => {
  return {};
});

const TEST_PASSWORD = 'Somepassword1234';
const TEST_MNEMONIC = bip39.generateMnemonic();

const createManyWallets = async (keyRing: PlugKeyRing): Promise<number> => {
  const many = Math.round(Math.random() * 20) + 2;
  for (let i = 1; i < many; i += 1) {
    await keyRing.createPrincipal(); // eslint-disable-line
  }
  return many;
};

const createManyTransactions = (): GetTransactionsResponse => {
  const many = Math.round(Math.random() * 20) + 2;
  const transactions: GetTransactionsResponse = { total: 0, transactions: [] };
  for (let i = 1; i < many; i += 1) {
    transactions.transactions.push({
      timestamp: RandomBigInt(32),
      hash: RandomBigInt(32),
      from: 'string',
      to: 'string',
      amount: BigInt(1000),
      currency: { symbol: 'ICP', decimals: 8 },
      fee: {
        amount: BigInt(1000),
        currency: { symbol: 'ICP', decimals: 8 },
      },
      status: 'COMPLETED',
      type: 'SEND',
    });
    transactions.transactions.push({
      timestamp: RandomBigInt(32),
      hash: RandomBigInt(32),
      from: 'string',
      to: 'string',
      amount: BigInt(1000),
      currency: { symbol: 'XTC', decimals: 5 },
      fee: {
        amount: BigInt(1000),
        currency: { symbol: 'XTC', decimals: 5 },
      },
      status: 'COMPLETED',
      type: 'SEND',
    });
  }
  return transactions;
};

describe('Plug KeyRing', () => {
  const testWallet = new PlugWallet({
    name: 'test',
    mnemonic: TEST_MNEMONIC,
    walletNumber: 0,
  });
  let keyRing: PlugKeyRing;
  const cleanup = async (): Promise<void> => {
    await store.clear();
    keyRing = new PlugKeyRing();
  };

  beforeAll(cleanup);
  beforeEach(cleanup);
  afterEach(cleanup);

  describe('initialization', () => {
    it('should be empty and locked if not initialized', async () => {
      await expect(() =>
        keyRing.setCurrentPrincipal(testWallet.walletNumber)
      ).rejects.toEqual(Error(ERRORS.NOT_INITIALIZED));
      await expect(() => keyRing.unlock(TEST_PASSWORD)).rejects.toEqual(
        Error(ERRORS.NOT_INITIALIZED)
      );
      await expect(() => keyRing.createPrincipal()).rejects.toEqual(
        Error(ERRORS.NOT_INITIALIZED)
      );
      await expect(() => keyRing.getState()).rejects.toEqual(
        Error(ERRORS.NOT_INITIALIZED)
      );
      expect(keyRing.isInitialized).toBe(false);
      expect(keyRing.isUnlocked).toBe(false);
    });
  });

  describe('creation', () => {
    it('should create a new keyring and be locked by default', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      expect(keyRing.isInitialized).toBe(true);
      expect(keyRing.isUnlocked).toBe(false);
      await expect(() => keyRing.getState()).rejects.toEqual(
        Error(ERRORS.STATE_LOCKED)
      );
    });
    it('should create a new keyring and expose state correctly', async () => {
      const { wallet } = await keyRing.create({ password: TEST_PASSWORD });
      expect(await keyRing.unlock(TEST_PASSWORD)).toEqual(true);
      expect(keyRing.isInitialized).toBe(true);
      expect(keyRing.isUnlocked).toBe(true);

      const state = await keyRing.getState();
      expect(state.wallets.length).toEqual(1);

      const stateWallet = state.wallets[0];
      expect(stateWallet.toJSON()).toEqual(wallet.toJSON());
      expect(state.password).toEqual(TEST_PASSWORD);
      expect(bip39.validateMnemonic(state.mnemonic as string)).toEqual(true);
      expect(stateWallet.registeredTokens).toEqual([TOKENS.XTC]);
    });
    it('should fail if not password was provided', async () => {
      await expect(() => keyRing.create({ password: '' })).rejects.toEqual(
        Error(ERRORS.PASSWORD_REQUIRED)
      );
    });
  });

  describe('import', () => {
    it('should import a keyring and expose state correctly', async () => {
      const { wallet } = await keyRing.importMnemonic({
        password: TEST_PASSWORD,
        mnemonic: TEST_MNEMONIC,
      });
      expect(keyRing.isInitialized).toBe(true);
      const unlocked = await keyRing.unlock(TEST_PASSWORD);

      expect(keyRing.isUnlocked).toBe(true);
      expect(unlocked).toEqual(true);

      const state = await keyRing.getState();
      expect(state.wallets.length).toEqual(1);
      const stateWallet = state.wallets[0];
      expect(stateWallet.toJSON()).toEqual(wallet.toJSON());
      expect(state.mnemonic).toEqual(TEST_MNEMONIC);
      expect(state.password).toEqual(TEST_PASSWORD);
      expect(bip39.validateMnemonic(state.mnemonic!)).toEqual(true);
      expect(stateWallet.registeredTokens).toEqual([TOKENS.XTC]);
      expect(stateWallet.connectedApps).toEqual([]);
    });
    it('should fail if not password or mnemonic were provided', async () => {
      await expect(() =>
        keyRing.importMnemonic({ password: '', mnemonic: TEST_MNEMONIC })
      ).rejects.toEqual(Error(ERRORS.PASSWORD_REQUIRED));
      await expect(() =>
        keyRing.importMnemonic({ password: TEST_PASSWORD, mnemonic: '' })
      ).rejects.toEqual(Error(ERRORS.INVALID_MNEMONIC));
      expect(keyRing.isInitialized).toBe(false);
    });
    it('should fail if the mnemonic is invalid', async () => {
      await expect(() =>
        keyRing.importMnemonic({
          password: TEST_PASSWORD,
          mnemonic: 'some test mnemonic',
        })
      ).rejects.toEqual(Error(ERRORS.INVALID_MNEMONIC));
      expect(keyRing.isInitialized).toBe(false);
    });
    it('should import the same wallet even with different passwords', async () => {
      const { wallet } = await keyRing.importMnemonic({
        mnemonic: TEST_MNEMONIC,
        password: TEST_PASSWORD,
      });
      const { wallet: newWallet } = await keyRing.importMnemonic({
        mnemonic: TEST_MNEMONIC,
        password: 'newpassword1',
      });
      expect(wallet.toJSON()).toEqual(newWallet.toJSON());
      expect(wallet.principal).toEqual(newWallet.principal);
    });
  });

  describe('lock', () => {
    it('should create a keyring and be locked by default', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await expect(() => keyRing.getState()).rejects.toEqual(
        Error(ERRORS.STATE_LOCKED)
      );
      expect(keyRing.isInitialized).toBe(true);
      expect(keyRing.isUnlocked).toBe(false);
    });
    it('should import a keyring and be locked by default', async () => {
      await keyRing.importMnemonic({
        password: TEST_PASSWORD,
        mnemonic: TEST_MNEMONIC,
      });
      await expect(() => keyRing.getState()).rejects.toEqual(
        Error(ERRORS.STATE_LOCKED)
      );
      expect(keyRing.isUnlocked).toBe(false);
    });
    it('should unlock correctly with correct password', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      expect(keyRing.isUnlocked).toBe(true);

      const state = await keyRing.getState();
      expect(state.wallets.length).toEqual(1);
      expect(state.password).toEqual(TEST_PASSWORD);
    });
    it('should fail to unlock with incorrect password', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      const unlocked = await keyRing.unlock('false1234');
      expect(unlocked).toBe(false);
      expect(keyRing.isUnlocked).toBe(false);
      await expect(() => keyRing.getState()).rejects.toEqual(
        Error(ERRORS.STATE_LOCKED)
      );
    });
    it('should lock correctly when unlocked', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      expect(keyRing.isUnlocked).toBe(true);
      await keyRing.lock();
      expect(keyRing.isUnlocked).toBe(false);
      await expect(() => keyRing.getState()).rejects.toEqual(
        Error(ERRORS.STATE_LOCKED)
      );
    });
  });
  describe('storage', () => {
    it('should persist data encypted correctly after creating a new keyring', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      const state = await keyRing.getState();
      const encryptedState = CryptoJS.AES.encrypt(
        JSON.stringify(state),
        TEST_PASSWORD
      );
      const { vault: stored, isInitialized } = store.get();
      expect(
        CryptoJS.AES.decrypt(encryptedState, TEST_PASSWORD).toString(
          CryptoJS.enc.Utf8
        )
      ).toEqual(
        CryptoJS.AES.decrypt(stored, TEST_PASSWORD).toString(CryptoJS.enc.Utf8)
      );
      expect(isInitialized).toEqual(true);
    });
    it('should persist data encypted correctly after importing a keyring', async () => {
      await keyRing.importMnemonic({
        mnemonic: TEST_MNEMONIC,
        password: TEST_PASSWORD,
      });
      await keyRing.unlock(TEST_PASSWORD);
      const state = await keyRing.getState();
      const encryptedState = CryptoJS.AES.encrypt(
        JSON.stringify(state),
        TEST_PASSWORD
      );
      const { vault: stored, isInitialized } = store.get();
      expect(
        CryptoJS.AES.decrypt(encryptedState, TEST_PASSWORD).toString(
          CryptoJS.enc.Utf8
        )
      ).toEqual(
        CryptoJS.AES.decrypt(stored, TEST_PASSWORD).toString(CryptoJS.enc.Utf8)
      );
      expect(isInitialized).toEqual(true);
    });
    it('should persist data encypted correctly after creating a new principal', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      const state = await keyRing.getState();
      const encryptedState = CryptoJS.AES.encrypt(
        JSON.stringify(state),
        TEST_PASSWORD
      );
      const { vault: stored, isInitialized } = store.get();
      expect(
        CryptoJS.AES.decrypt(encryptedState, TEST_PASSWORD).toString(
          CryptoJS.enc.Utf8
        )
      ).toEqual(
        CryptoJS.AES.decrypt(stored, TEST_PASSWORD).toString(CryptoJS.enc.Utf8)
      );
      expect(isInitialized).toEqual(true);
    });
    it('should persist data encypted correctly after registering a new token', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.registerToken('5ymop-yyaaa-aaaah-qaa4q-cai'); // register XTC
      const state = await keyRing.getState();
      const encryptedState = CryptoJS.AES.encrypt(
        JSON.stringify(state),
        TEST_PASSWORD
      );
      const { vault: stored, isInitialized } = store.get();
      expect(
        CryptoJS.AES.decrypt(encryptedState, TEST_PASSWORD).toString(
          CryptoJS.enc.Utf8
        )
      ).toEqual(
        CryptoJS.AES.decrypt(stored, TEST_PASSWORD).toString(CryptoJS.enc.Utf8)
      );
      expect(isInitialized).toEqual(true);
    });
  });
  it('should persist data encypted correctly after adding a new app', async () => {
    await keyRing.create({ password: TEST_PASSWORD });
    await keyRing.unlock(TEST_PASSWORD);
    await keyRing.addConnectedApp({
      name: 'Chris',
      icon: ':smile:',
      url: 'dx4k2-mtdzp-qavet-nrazz-4tmro-oii6a-hlrlv-azdys-5j72q-ids2p-cae',
      whitelist: [],
    });
    const state = await keyRing.getState();
    const encryptedState = CryptoJS.AES.encrypt(
      JSON.stringify(state),
      TEST_PASSWORD
    );
    const { vault: stored, isInitialized } = store.get();
    expect(
      CryptoJS.AES.decrypt(encryptedState, TEST_PASSWORD).toString(
        CryptoJS.enc.Utf8
      )
    ).toEqual(
      CryptoJS.AES.decrypt(stored, TEST_PASSWORD).toString(CryptoJS.enc.Utf8)
    );
    expect(isInitialized).toEqual(true);
  });
  describe('principal management', () => {
    it('should create new principals correctly when unlocked', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      let state = await keyRing.getState();
      expect(state.wallets.length).toEqual(2);
      await keyRing.createPrincipal();
      state = await keyRing.getState();
      expect(state.wallets.length).toEqual(3);
    });
    it('should create many new principals correctly', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      await keyRing.createPrincipal();
      await keyRing.createPrincipal();
      await keyRing.createPrincipal();
      const state = await keyRing.getState();
      expect(state.wallets.length).toEqual(5);
    });
    it('should fail to create new principals when locked', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await expect(() => keyRing.createPrincipal()).rejects.toEqual(
        Error(ERRORS.STATE_LOCKED)
      );
    });
    it('should set the current principal correctly', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      const wallet = await keyRing.createPrincipal();
      await keyRing.setCurrentPrincipal(wallet.walletNumber);
      expect(keyRing.currentWalletId).toEqual(wallet.walletNumber);
      expect(keyRing.currentWallet).toEqual(wallet);
    });
    it('should fail to set invalid current principal ', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await expect(() => keyRing.setCurrentPrincipal(1)).rejects.toEqual(
        new Error(ERRORS.INVALID_WALLET_NUMBER)
      );
      await expect(() => keyRing.setCurrentPrincipal(-2)).rejects.toEqual(
        new Error(ERRORS.INVALID_WALLET_NUMBER)
      );
      await expect(() => keyRing.setCurrentPrincipal(1.2)).rejects.toEqual(
        new Error(ERRORS.INVALID_WALLET_NUMBER)
      );
    });
    it('should create new wallets with a default name', async () => {
      const { wallet } = await keyRing.create({ password: TEST_PASSWORD });
      expect(wallet.name).toEqual('Account 1');
      const { wallet: newWallet } = await keyRing.importMnemonic({
        mnemonic: TEST_MNEMONIC,
        password: TEST_PASSWORD,
      });
      expect(newWallet.name).toEqual('Account 1');
    });
    it('should create new wallets with a correct name and emoji', async () => {
      const { wallet } = await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      const wallet2 = await keyRing.createPrincipal({
        name: 'My new wallet',
        icon: ':smile:',
      }); // TODO: TS does not like emojis, but they are unicode strings
      expect(wallet2.name).toEqual('My new wallet');
      expect(wallet2.icon).toEqual(':smile:');
      const wallet3 = await keyRing.createPrincipal({
        name: 'My third wallet',
      }); // TODO: TS does not like emojis, but they are unicode strings
      expect(wallet3.name).toEqual('My third wallet');
      expect(wallet3.icon).toEqual(wallet.icon);
      const wallet4 = await keyRing.createPrincipal({
        icon: ':crying:',
      }); // TODO: TS does not like emojis, but they are unicode strings
      expect(wallet4.name).toEqual(wallet.name);
      expect(wallet4.icon).toEqual(':crying:');
    });
    it('should change the wallets name correctly', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      await keyRing.createPrincipal();
      await keyRing.editPrincipal(0, { name: 'New name1' });
      await keyRing.editPrincipal(1, { name: 'New name2' });
      await keyRing.editPrincipal(2, { name: 'New name3' });

      const { wallets } = await keyRing.getState();
      expect(wallets[0].name).toEqual('New name1');
      expect(wallets[1].name).toEqual('New name2');
      expect(wallets[2].name).toEqual('New name3');
    });
    it('should fail to change an invalid wallet', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await expect(() =>
        keyRing.editPrincipal(10, { name: 'New name', emoji: 'test' })
      ).rejects.toEqual(Error(ERRORS.INVALID_WALLET_NUMBER));
      await expect(() =>
        keyRing.editPrincipal(-1, { name: 'New name', emoji: 'test' })
      ).rejects.toEqual(Error(ERRORS.INVALID_WALLET_NUMBER));
      await expect(() =>
        keyRing.editPrincipal(1.231, { name: 'New name', emoji: 'test' })
      ).rejects.toEqual(Error(ERRORS.INVALID_WALLET_NUMBER));
    });
    it('should change the wallet icon correctly', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      await keyRing.createPrincipal();
      await keyRing.editPrincipal(0, { emoji: '123' });
      await keyRing.editPrincipal(1, { emoji: 'New emoji2' });
      await keyRing.editPrincipal(2, { emoji: 'New name3' });

      const { wallets } = await keyRing.getState();
      expect(wallets[0].icon).toEqual('123');
      expect(wallets[1].icon).toEqual('New emoji2');
      expect(wallets[2].icon).toEqual('New name3');
    });
    // Skipped since color is breaking it
    it('should register a token correctly to different subaccounts', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await keyRing.createPrincipal();
      await keyRing.createPrincipal();
      await keyRing.registerToken('5ymop-yyaaa-aaaah-qaa4q-cai', 1); // register WTC to other subaccounts
      await keyRing.registerToken('5ymop-yyaaa-aaaah-qaa4q-cai', 2); // register WTC
      await keyRing.registerToken('5ymop-yyaaa-aaaah-qaa4q-cai', 2); // register WTC twice

      const { wallets } = await keyRing.getState();
      expect(wallets[0].registeredTokens).toMatchObject([TOKENS.XTC]);
      expect(wallets[1].registeredTokens).toMatchObject([
        TOKENS.XTC,
        TOKENS.WTC,
      ]);
      expect(wallets[2].registeredTokens).toMatchObject([
        TOKENS.XTC,
        TOKENS.WTC,
      ]);
    });
    test('should fail to register an invalid canister id', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await expect(() => keyRing.registerToken('test')).rejects.toEqual(
        new Error(ERRORS.INVALID_CANISTER_ID)
      );
      await expect(() =>
        keyRing.registerToken(
          'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe'
        )
      ).rejects.toEqual(new Error(ERRORS.INVALID_CANISTER_ID));
    });
    test('should fail to add an app with an invalid canister whitelisted', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      await expect(() =>
        keyRing.addConnectedApp({
          name: 'Chris',
          icon: ':smile:',
          url: 'chris123',
          whitelist: [
            'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
          ],
        })
      ).rejects.toEqual(new Error(ERRORS.INVALID_APP));
    });
    test('should do nothing if app was already added', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      const app = {
        name: 'Chris',
        icon: ':smile:',
        url: 'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
        whitelist: [],
      };
      const connectedApps = await keyRing.addConnectedApp(app);
      await keyRing.addConnectedApp(app);
      expect(connectedApps).toEqual([app]);
    });
    test('should delete correctly a previously saved app', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      const app1 = {
        name: 'App1',
        icon: ':smile:',
        url: 'test123.com',
        whitelist: [],
      };
      const app2 = {
        name: 'App2',
        icon: ':sad:',
        url: 'plugwallet.ooo',
        whitelist: [],
      };
      let connectedApps = await keyRing.addConnectedApp(app1);
      connectedApps = await keyRing.addConnectedApp(app2);
      expect(connectedApps).toEqual([app1, app2]);
      connectedApps = await keyRing.deleteConnectedApp(app1.url);
      expect(connectedApps).toEqual([app2]);
      connectedApps = await keyRing.deleteConnectedApp(app2.url);
      expect(connectedApps).toEqual([]);
    });
    test('should do nothing when trying to delete an unexistant app', async () => {
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      const account = {
        name: 'Some app',
        icon: ':smile:',
        url: 'test123.com',
        whitelist: [],
      };
      const connectedApps = await keyRing.deleteConnectedApp(account.url);
      expect(connectedApps).toEqual([]);
    });
  });

  describe('get balance', () => {
    const balances = {};
    let walletsCreated = 0;
    beforeEach(async () => {
      keyRing = new PlugKeyRing();
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      walletsCreated = await createManyWallets(keyRing);
      const state = await keyRing.getState();
      state.wallets.forEach(wallet => {
        const randomBalance = RandomBigInt(32);
        balances[wallet.walletNumber] = randomBalance;
        jest.spyOn(wallet, 'getBalance').mockImplementation(
          jest.fn(() => {
            return Promise.resolve(randomBalance);
          })
        );
      });
    });

    test('get default balance', async () => {
      expect(await keyRing.getBalance()).toBe(balances[0]);
    });

    test('get specific balance', async () => {
      const ind = Math.round(Math.random() * (walletsCreated - 1));

      expect(await keyRing.getBalance(ind)).toBe(balances[ind]);
    });

    test('get error with invalid wallet numbers', async () => {
      await expect(keyRing.getBalance(-2)).rejects.toThrow(
        ERRORS.INVALID_WALLET_NUMBER
      );
      await expect(keyRing.getBalance(walletsCreated + 2)).rejects.toThrow(
        ERRORS.INVALID_WALLET_NUMBER
      );
    });
  });

  describe('get transactions', () => {
    const transactions = {};
    let walletsCreated = 0;
    beforeEach(async () => {
      keyRing = new PlugKeyRing();
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      walletsCreated = await createManyWallets(keyRing);
      const state = await keyRing.getState();
      state.wallets.forEach(wallet => {
        const randomTransactions = createManyTransactions();
        transactions[wallet.walletNumber] = randomTransactions;
        jest.spyOn(wallet, 'getTransactions').mockImplementation(
          jest.fn(() => {
            return Promise.resolve(randomTransactions);
          })
        );
      });
    });

    test('get default balance', async () => {
      expect(await keyRing.getTransactions()).toBe(transactions[0]);
    });

    test('get specific balance', async () => {
      const ind = Math.round(Math.random() * (walletsCreated - 1));

      expect(await keyRing.getTransactions(ind)).toBe(transactions[ind]);
    });

    test('get error with invalid wallet numbers', async () => {
      await expect(keyRing.getTransactions(-2)).rejects.toThrow(
        ERRORS.INVALID_WALLET_NUMBER
      );
      await expect(keyRing.getTransactions(walletsCreated + 2)).rejects.toThrow(
        ERRORS.INVALID_WALLET_NUMBER
      );
    });
  });

  describe('sendICP', () => {
    let walletsCreated = 0;
    beforeEach(async () => {
      keyRing = new PlugKeyRing();
      await keyRing.create({ password: TEST_PASSWORD });
      await keyRing.unlock(TEST_PASSWORD);
      walletsCreated = await createManyWallets(keyRing);
    });

    it('call create agent with secret key', async () => {
      const { wallets } = await keyRing.getState();
      const amount = RandomBigInt(32);
      const ind = Math.round(Math.random() * (walletsCreated - 1));
      const to = wallets[ind].principal;

      await keyRing.send(to.toString(), amount);
      expect(createAgent).toHaveBeenCalled();
    });
    it('call sendICP with to account', async () => {
      const { wallets } = await keyRing.getState();
      const amount = RandomBigInt(32);
      const ind = Math.round(Math.random() * (walletsCreated - 1));
      const to = getAccountId(Principal.fromText(wallets[ind].principal));

      await keyRing.send(to, amount);
      expect(createAgent).toHaveBeenCalled();
      expect(mockSendICP.mock.calls[0][0].amount).toEqual(amount);
      expect(mockSendICP.mock.calls[0][0].to).toEqual(to);
    });

    it('call sendICP with to principal', async () => {
      const { wallets } = await keyRing.getState();
      const amount = RandomBigInt(32);
      const ind = Math.round(Math.random() * (walletsCreated - 1));
      const to = wallets[ind].principal;

      await keyRing.send(to.toString(), amount);
      expect(createAgent).toHaveBeenCalled();
      expect(mockSendICP.mock.calls[0][0].amount).toEqual(amount);
      expect(mockSendICP.mock.calls[0][0].to).toEqual(
        getAccountId(Principal.fromText(to))
      );
    });
    describe('nfts', () => {
      beforeEach(async () => {
        keyRing = new PlugKeyRing();
        await keyRing.importMnemonic({
          password: TEST_PASSWORD,
          mnemonic: TEST_MNEMONIC,
        });
        await keyRing.unlock(TEST_PASSWORD);
      });
      it('should fetch IC Punks correctly', async () => {
        const nfts = await keyRing.getNFTs();
        expect(nfts).toEqual([
          {
            id: BigInt(10),
            url: '/Token/10',
            owner: [
              'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
            ],
            desc: 'Example description of ICPunk',
            name: 'ICPunk #10',
            properties: [],
          },
        ]);
      });
      it('should fail to fetch IC Punks on inexistant account', async () => {
        await expect(keyRing.getNFTs(1)).rejects.toThrow(
          ERRORS.INVALID_WALLET_NUMBER
        );
      });
      it('should transfer a punk correctly', async () => {
        const nfts = await keyRing.getNFTs();
        const transferred = await keyRing.transferNFT({
          id: nfts[0].id,
          to: 'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
        });
        expect(transferred).toEqual(true);
      });
      it('should fail to transfer IC Punks on inexistant account', async () => {
        const nfts = await keyRing.getNFTs();
        await expect(
          keyRing.transferNFT({
            subAccount: 1,
            id: nfts[0].id,
            to:
              'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
          })
        ).rejects.toThrow(ERRORS.INVALID_WALLET_NUMBER);
      });
      // TODO: Not sure how to make it fail.
      it('should fail to transfer IC Punks that is not owned', async () => {
        await expect(
          keyRing.transferNFT({
            id: BigInt(130),
            to:
              'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6-qj5tg-ydzjf-qrwe2-lbzwp-7qe',
          })
        ).rejects.toThrow(ERRORS.TRANSFER_NFT_ERROR);
      });
      it('should fail to transfer IC Punks to invalid principal', async () => {
        const nfts = await keyRing.getNFTs();
        // Malformed pid
        await expect(
          keyRing.transferNFT({
            id: nfts[0]?.id,
            to: 'ogkan-uvha2-mbm2l-isqcz-odcvg-szdx6lbzwp-7qe',
          })
        ).rejects.toThrow(ERRORS.INVALID_PRINCIPAL_ID);

        // Account ID
        await expect(
          keyRing.transferNFT({
            id: nfts[0]?.id,
            to:
              '9627c5abbae5b63b3a1b2ad8b6ee85e99e45317c4276c8addb39211ce05d2a59',
          })
        ).rejects.toThrow(ERRORS.INVALID_PRINCIPAL_ID);

        // CONNFIRM WITH IC PUNKS
        // Canister ID
        await expect(
          keyRing.transferNFT({
            id: nfts[0]?.id,
            to: '6xisx-7yaaa-aaaah-aagga-cai',
          })
        ).rejects.toThrow(ERRORS.INVALID_PRINCIPAL_ID);
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });
});

/* eslint-disable @typescript-eslint/class-name-casing */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */
export const mockRosettaTransaction = {
  ok: true,
  json: () => ({
    transactions: [
      {
        block_identifier: {
          index: 163263,
          hash:
            'd5b368a452a20f20ba7ea284f63da3b0880853f27652c593f7f279d1a85e02eb',
        },
        transaction: {
          transaction_identifier: {
            hash:
              '77d3b28f4e6b7aea6c012ff7707b21b8b398f5146053a6038b2ff02b983bba2e',
          },
          operations: [
            {
              operation_identifier: { index: 0 },
              type: 'TRANSACTION',
              status: 'COMPLETED',
              account: {
                address:
                  '4dfa940def17f1427ae47378c440f10185867677109a02bc8374fc25b9dee8af',
              },
              amount: {
                value: '-20000000',
                currency: { symbol: 'ICP', decimals: 8 },
              },
            },
            {
              operation_identifier: { index: 1 },
              type: 'TRANSACTION',
              status: 'COMPLETED',
              account: {
                address:
                  '3cbd622655d0496c6e28398f5d6889c45fab26d22dcc735da6832f867fd290a3',
              },
              amount: {
                value: '20000000',
                currency: { symbol: 'ICP', decimals: 8 },
              },
            },
            {
              operation_identifier: { index: 2 },
              type: 'FEE',
              status: 'COMPLETED',
              account: {
                address:
                  '4dfa940def17f1427ae47378c440f10185867677109a02bc8374fc25b9dee8af',
              },
              amount: {
                value: '-10000',
                currency: { symbol: 'ICP', decimals: 8 },
              },
            },
          ],
          metadata: {
            block_height: 163263,
            memo: 17658957290334035096,
            timestamp: 1623432025640774091,
          },
        },
      },
      {
        block_identifier: {
          index: 170497,
          hash:
            '0112c7ae622a3542dc5e2642367c685eee983082d0ac11d21a1f03d4ea0045df',
        },
        transaction: {
          transaction_identifier: {
            hash:
              'b288ebc8facbacbb3fb3b0e2864c99feaf3898bea8c33d6a1ecc793d2177ded3',
          },
          operations: [
            {
              operation_identifier: { index: 0 },
              type: 'TRANSACTION',
              status: 'COMPLETED',
              account: {
                address:
                  '3cbd622655d0496c6e28398f5d6889c45fab26d22dcc735da6832f867fd290a3',
              },
              amount: {
                value: '-10000',
                currency: { symbol: 'ICP', decimals: 8 },
              },
            },
            {
              operation_identifier: { index: 1 },
              type: 'TRANSACTION',
              status: 'COMPLETED',
              account: {
                address:
                  '4dfa940def17f1427ae47378c440f10185867677109a02bc8374fc25b9dee8af',
              },
              amount: {
                value: '10000',
                currency: { symbol: 'ICP', decimals: 8 },
              },
            },
            {
              operation_identifier: { index: 2 },
              type: 'FEE',
              status: 'COMPLETED',
              account: {
                address:
                  '3cbd622655d0496c6e28398f5d6889c45fab26d22dcc735da6832f867fd290a3',
              },
              amount: {
                value: '-10000',
                currency: { symbol: 'ICP', decimals: 8 },
              },
            },
          ],
          metadata: {
            block_height: 170497,
            memo: 1085832164,
            timestamp: 1623531693580114606,
          },
        },
      },
    ],
    total_count: 2,
  }),
};

export const mockXTCTransactions = [
  {
    txnId: '1166',
    event: {
      cycles: 1,
      kind: {
        Transfer: {
          from: {
            _isPrincipal: true,
            _arr: {
              '0': 238,
              '1': 182,
              '2': 122,
              '3': 249,
              '4': 253,
              '5': 205,
              '6': 1,
              '7': 244,
              '8': 188,
              '9': 239,
              '10': 103,
              '11': 22,
              '12': 0,
              '13': 44,
              '14': 40,
              '15': 143,
              '16': 218,
              '17': 132,
              '18': 81,
              '19': 94,
              '20': 79,
              '21': 37,
              '22': 87,
              '23': 113,
              '24': 63,
              '25': 113,
              '26': 175,
              '27': 117,
              '28': 2,
            },
          },
          to: {
            _isPrincipal: true,
            _arr: {
              '0': 233,
              '1': 136,
              '2': 172,
              '3': 214,
              '4': 124,
              '5': 158,
              '6': 0,
              '7': 138,
              '8': 92,
              '9': 99,
              '10': 118,
              '11': 115,
              '12': 167,
              '13': 109,
              '14': 45,
              '15': 164,
              '16': 10,
              '17': 190,
              '18': 103,
              '19': 105,
              '20': 88,
              '21': 27,
              '22': 50,
              '23': 87,
              '24': 26,
              '25': 160,
              '26': 234,
              '27': 125,
              '28': 2,
            },
          },
        },
      },
      fee: 0,
      timestamp: 1629386839664,
    },
  },
  {
    txnId: '1167',
    event: {
      cycles: 1,
      kind: {
        Transfer: {
          from: {
            _isPrincipal: true,
            _arr: {
              '0': 238,
              '1': 182,
              '2': 122,
              '3': 249,
              '4': 253,
              '5': 205,
              '6': 1,
              '7': 244,
              '8': 188,
              '9': 239,
              '10': 103,
              '11': 22,
              '12': 0,
              '13': 44,
              '14': 40,
              '15': 143,
              '16': 218,
              '17': 132,
              '18': 81,
              '19': 94,
              '20': 79,
              '21': 37,
              '22': 87,
              '23': 113,
              '24': 63,
              '25': 113,
              '26': 175,
              '27': 117,
              '28': 2,
            },
          },
          to: {
            _isPrincipal: true,
            _arr: {
              '0': 233,
              '1': 136,
              '2': 172,
              '3': 214,
              '4': 124,
              '5': 158,
              '6': 0,
              '7': 138,
              '8': 92,
              '9': 99,
              '10': 118,
              '11': 115,
              '12': 167,
              '13': 109,
              '14': 45,
              '15': 164,
              '16': 10,
              '17': 190,
              '18': 103,
              '19': 105,
              '20': 88,
              '21': 27,
              '22': 50,
              '23': 87,
              '24': 26,
              '25': 160,
              '26': 234,
              '27': 125,
              '28': 2,
            },
          },
        },
      },
      fee: 0,
      timestamp: 1629386855226,
    },
  },
  {
    txnId: '1168',
    event: {
      cycles: 1,
      kind: {
        Transfer: {
          from: {
            _isPrincipal: true,
            _arr: {
              '0': 238,
              '1': 182,
              '2': 122,
              '3': 249,
              '4': 253,
              '5': 205,
              '6': 1,
              '7': 244,
              '8': 188,
              '9': 239,
              '10': 103,
              '11': 22,
              '12': 0,
              '13': 44,
              '14': 40,
              '15': 143,
              '16': 218,
              '17': 132,
              '18': 81,
              '19': 94,
              '20': 79,
              '21': 37,
              '22': 87,
              '23': 113,
              '24': 63,
              '25': 113,
              '26': 175,
              '27': 117,
              '28': 2,
            },
          },
          to: {
            _isPrincipal: true,
            _arr: {
              '0': 233,
              '1': 136,
              '2': 172,
              '3': 214,
              '4': 124,
              '5': 158,
              '6': 0,
              '7': 138,
              '8': 92,
              '9': 99,
              '10': 118,
              '11': 115,
              '12': 167,
              '13': 109,
              '14': 45,
              '15': 164,
              '16': 10,
              '17': 190,
              '18': 103,
              '19': 105,
              '20': 88,
              '21': 27,
              '22': 50,
              '23': 87,
              '24': 26,
              '25': 160,
              '26': 234,
              '27': 125,
              '28': 2,
            },
          },
        },
      },
      fee: 0,
      timestamp: 1629386887795,
    },
  },
  {
    txnId: '1169',
    event: {
      cycles: 1,
      kind: {
        Transfer: {
          from: {
            _isPrincipal: true,
            _arr: {
              '0': 238,
              '1': 182,
              '2': 122,
              '3': 249,
              '4': 253,
              '5': 205,
              '6': 1,
              '7': 244,
              '8': 188,
              '9': 239,
              '10': 103,
              '11': 22,
              '12': 0,
              '13': 44,
              '14': 40,
              '15': 143,
              '16': 218,
              '17': 132,
              '18': 81,
              '19': 94,
              '20': 79,
              '21': 37,
              '22': 87,
              '23': 113,
              '24': 63,
              '25': 113,
              '26': 175,
              '27': 117,
              '28': 2,
            },
          },
          to: {
            _isPrincipal: true,
            _arr: {
              '0': 233,
              '1': 136,
              '2': 172,
              '3': 214,
              '4': 124,
              '5': 158,
              '6': 0,
              '7': 138,
              '8': 92,
              '9': 99,
              '10': 118,
              '11': 115,
              '12': 167,
              '13': 109,
              '14': 45,
              '15': 164,
              '16': 10,
              '17': 190,
              '18': 103,
              '19': 105,
              '20': 88,
              '21': 27,
              '22': 50,
              '23': 87,
              '24': 26,
              '25': 160,
              '26': 234,
              '27': 125,
              '28': 2,
            },
          },
        },
      },
      fee: 0,
      timestamp: 1629386903423,
    },
  },
  {
    txnId: '1170',
    event: {
      cycles: 1,
      kind: {
        Transfer: {
          from: {
            _isPrincipal: true,
            _arr: {
              '0': 238,
              '1': 182,
              '2': 122,
              '3': 249,
              '4': 253,
              '5': 205,
              '6': 1,
              '7': 244,
              '8': 188,
              '9': 239,
              '10': 103,
              '11': 22,
              '12': 0,
              '13': 44,
              '14': 40,
              '15': 143,
              '16': 218,
              '17': 132,
              '18': 81,
              '19': 94,
              '20': 79,
              '21': 37,
              '22': 87,
              '23': 113,
              '24': 63,
              '25': 113,
              '26': 175,
              '27': 117,
              '28': 2,
            },
          },
          to: {
            _isPrincipal: true,
            _arr: {
              '0': 233,
              '1': 136,
              '2': 172,
              '3': 214,
              '4': 124,
              '5': 158,
              '6': 0,
              '7': 138,
              '8': 92,
              '9': 99,
              '10': 118,
              '11': 115,
              '12': 167,
              '13': 109,
              '14': 45,
              '15': 164,
              '16': 10,
              '17': 190,
              '18': 103,
              '19': 105,
              '20': 88,
              '21': 27,
              '22': 50,
              '23': 87,
              '24': 26,
              '25': 160,
              '26': 234,
              '27': 125,
              '28': 2,
            },
          },
        },
      },
      fee: 0,
      timestamp: 1629386947808,
    },
  },
];

export const mockTransactionResult = {
  total: 2,
  transactions: [
    {
      status: 'COMPLETED',
      fee: {
        amount: BigInt(-10000),
        currency: { symbol: 'ICP', decimals: 8 },
      },
      from: '4dfa940def17f1427ae47378c440f10185867677109a02bc8374fc25b9dee8af',
      type: 'RECEIVE',
      amount: BigInt(20000000),
      currency: { symbol: 'ICP', decimals: 8 },
      to: '3cbd622655d0496c6e28398f5d6889c45fab26d22dcc735da6832f867fd290a3',
      hash: '77d3b28f4e6b7aea6c012ff7707b21b8b398f5146053a6038b2ff02b983bba2e',
      timestamp: 1623432025640.7742,
    },
    {
      status: 'COMPLETED',
      fee: { amount: BigInt(-10000), currency: { symbol: 'ICP', decimals: 8 } },
      from: '3cbd622655d0496c6e28398f5d6889c45fab26d22dcc735da6832f867fd290a3',
      type: 'SEND',
      amount: BigInt(10000),
      currency: { symbol: 'ICP', decimals: 8 },
      to: '4dfa940def17f1427ae47378c440f10185867677109a02bc8374fc25b9dee8af',
      hash: 'b288ebc8facbacbb3fb3b0e2864c99feaf3898bea8c33d6a1ecc793d2177ded3',
      timestamp: 1623531693580.1147,
    },
  ],
};

export const mockAccountID =
  '3cbd622655d0496c6e28398f5d6889c45fab26d22dcc735da6832f867fd290a3';
export default {};

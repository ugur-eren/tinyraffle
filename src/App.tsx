import {
  Program,
  AnchorProvider,
  web3,
  BN,
  utils,
  BorshInstructionCoder,
} from '@project-serum/anchor';
import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {useConnection, useAnchorWallet, useWallet} from '@solana/wallet-adapter-react';
import {
  clusterApiUrl,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import {
  SwitchboardProgram,
  QueueAccount,
  VrfAccount,
  PermissionAccount,
  NativeMint,
  TransactionObject,
} from '@switchboard-xyz/solana.js';
import {useEffect} from 'react';
import {VRFClientIDL} from './contracts';

import Router from './routes/Router';

const programAddress = 'EmEvpcSsVwZ3VVuQEKiqiGNBYEDy52TBVz1WULdccjzA';
const programId = new PublicKey(programAddress);

const App: React.FC = () => {
  const {connection} = useConnection();
  const {sendTransaction, signTransaction} = useWallet();
  const anchor = useAnchorWallet();

  useEffect(() => {
    (async () => {
      if (!anchor || !sendTransaction || !signTransaction) return;

      const provider = new AnchorProvider(connection, anchor, {
        commitment: 'processed',
      });

      const program = new Program(VRFClientIDL, programId, provider);

      const vrfSecret = web3.Keypair.generate();
      console.log(`VRF Account: ${vrfSecret.publicKey}`);

      const [vrfClientKey] = utils.publicKey.findProgramAddressSync(
        [Buffer.from('CLIENTSEED'), vrfSecret.publicKey.toBytes()],
        program.programId,
      );
      console.log(`VRF Client: ${vrfClientKey}`);

      // SWITCHBOARD

      const switchboard = await SwitchboardProgram.load('devnet', connection);

      const [queueAccount, oracleQueueAccountData] = await QueueAccount.load(
        switchboard,
        'F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy',
      );

      console.log('queueAccount', queueAccount);
      console.log('oracleQueueAccountData', oracleQueueAccountData);

      await new Promise((resolve) => {
        (function wait() {
          queueAccount.isReady().then((isReady) => {
            if (isReady) resolve(true);
            else wait();
          });
        })();
      });

      const [vrfAccount, vrfAccountTxObject] = await VrfAccount.createInstructions(
        switchboard,
        provider.wallet.publicKey,
        {
          vrfKeypair: vrfSecret,
          authority: vrfClientKey,
          queueAccount,
          callback: {
            programId: program.programId,
            accounts: [
              {pubkey: vrfClientKey, isSigner: false, isWritable: true},
              {pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false},
            ],
            ixData: new BorshInstructionCoder(program.idl).encode('consumeRandomness', ''),
          },
        },
      );

      console.log(
        'vrfAccountTx',
        await sendTransaction(
          vrfAccountTxObject.sign(await connection.getLatestBlockhash(), [vrfSecret]),
          connection,
        ),
      );

      console.log(`Created VRF Account: ${vrfAccount.publicKey}`);

      // Create VRF Client account
      // INIT CLIENT
      const initClientTx = await program.methods
        .initClient({
          maxResult: new BN(1337),
        })
        .accounts({
          state: vrfClientKey,
          vrf: vrfAccount.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .transaction();

      console.log('initClientTx', await sendTransaction(initClientTx, connection));

      console.log('Created VrfClient Account:', vrfClientKey.toString());

      console.log('Now requestin randomness sectionnnnnn hadi!!!');

      // REQUEST RANDOMNESSSSSSSSSSSSSSSSSSSSSSSSSSSS

      const queue = await queueAccount.loadData();
      const vrf = await vrfAccount.loadData();

      console.log(`WTF is vrf`, vrf);

      // derive the existing VRF permission account using the seeds
      console.log('permission is coming');

      const [permissionAccount, permissionAccountTxObject] = PermissionAccount.createInstruction(
        switchboard,
        provider.wallet.publicKey,
        {
          granter: queueAccount.publicKey,
          grantee: vrfAccount.publicKey,
          authority: queue.authority,
        },
      );

      console.log(
        'permissionAccountTx',
        await sendTransaction(
          permissionAccountTxObject.toTxn(await connection.getLatestBlockhash()),
          connection,
        ),
      );

      const [cumac, permissionBump] = PermissionAccount.fromSeed(
        switchboard,
        queue.authority,
        queueAccount.publicKey,
        vrfAccount.publicKey,
      );

      console.log(
        `permisson is done +++ payer token wallet is coming: ${permissionAccount.publicKey}`,
      );

      const Mint = await NativeMint.load(provider);

      const [payerTokenWallet, payerTokenWalletTxObject] = await Mint.getOrCreateWrappedUser(
        provider.wallet.publicKey,
        {
          fundUpTo: 0.002,
        },
      );

      console.log('Requesssstiiiiiing');

      const vrfAccounts = await vrfAccount.fetchAccounts();

      // Request randomness
      const requestRandomnessTx = await program.methods
        .requestRandomness({
          switchboardStateBump: switchboard.programState.bump,
          permissionBump,
        })
        .accounts({
          state: vrfClientKey,
          vrf: vrfAccount.publicKey,
          oracleQueue: 'F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy',
          queueAuthority: '2KgowxogBrGqRcgXQEmqFvC3PGtCu66qERNJevYW8Ajh',
          dataBuffer: '7yJ3sSifpmUFB5BcXy6yMDje15xw2CovJjfXfBKsCfT5',
          permission: permissionAccount.publicKey,
          escrow: vrf.escrow,
          programState: switchboard.programState.publicKey,
          switchboardProgram: switchboard.programId,
          payerWallet: payerTokenWallet,
          payerAuthority: provider.wallet.publicKey,
          recentBlockhashes: web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        })
        .transaction();

      console.log('requestRandomnessTx', await sendTransaction(requestRandomnessTx, connection));

      console.log('Requested RANDOMNES!');

      const result = await vrfAccount.nextResult(new BN(vrf.counter.toNumber() + 1), 180_000);

      console.log(result);

      if (!result.success) {
        throw new Error(`Failed to get VRF Result: ${result.status}`);
      }

      const vrfClientState = await program.account.vrfClientState.fetch(vrfClientKey);
      console.log('VRF CLIENT STATE IS COMIIING');
      console.log(vrfClientState);

      console.log(`Vrf client state??? ${vrfClientState}`);
      console.log(`Max result: ${(vrfClientState.maxResult as any).toString(10)}`);
      console.log(`Max result: ${(vrfClientState.maxResult as any).toString(10)}`);
      console.log(`random number: ${(vrfClientState.result as any).toString(10)}`);

      const callbackTxnMeta = await vrfAccount.getCallbackTransactions();
      console.log(callbackTxnMeta);
    })();
  });

  return <Router />;
};

export default App;

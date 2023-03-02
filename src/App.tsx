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

      const [vrfClientKey] = utils.publicKey.findProgramAddressSync(
        [Buffer.from('CLIENTSEED'), vrfSecret.publicKey.toBytes()],
        program.programId,
      );

      console.log(`VRF Client: ${vrfClientKey}`);

      // SWITCHBOARD

      const switchboard: SwitchboardProgram = await SwitchboardProgram.load('devnet', connection);

      const [queueAccount, txnSignature] = await QueueAccount.load(
        switchboard,
        'F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy',
      );

      console.log(`Transaction signature of queue Account`, txnSignature);

      let isReady = false;
      while (!isReady) {
        // eslint-disable-next-line no-await-in-loop
        isReady = await queueAccount.isReady();
      }

      const [vrfAccount, txObject] = await VrfAccount.createInstructions(
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

      const latestBlock = await connection.getLatestBlockhash();

      const vrfTx = txObject.toTxn({
        blockhash: latestBlock.blockhash,
        lastValidBlockHeight: latestBlock.lastValidBlockHeight,
      });

      vrfTx.sign(vrfSecret);
      const vrfTxSent = await sendTransaction(vrfTx, connection);

      console.log('vrfTxSent', vrfTxSent);

      console.log(`Created VRF Account: ${vrfAccount.publicKey}`);

      const txData = await program.methods
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

      console.log('txData', txData);

      const tx = await sendTransaction(txData, connection);

      console.log('tx', tx);

      // REQUEST RANDOMNESSSSSSSSSSSSSSSSSSSSSSSSSSSS
      const queue = await queueAccount.loadData();
      const vrf = await vrfAccount.loadData();
      console.log(`WTF is vrf ${vrf}`);

      // derive the existing VRF permission account using the seeds
      console.log('permission is coming');

      const [permissionAccount, permissionTxObject] = PermissionAccount.createInstruction(
        switchboard,
        provider.wallet.publicKey,
        {
          granter: queueAccount.publicKey,
          grantee: vrfAccount.publicKey,
          authority: queue.authority,
        },
      );

      const newLatestBlock = await connection.getLatestBlockhash();

      const permissionTx = permissionTxObject.toTxn({
        blockhash: newLatestBlock.blockhash,
        lastValidBlockHeight: newLatestBlock.lastValidBlockHeight,
      });

      const permissionTxSent = await sendTransaction(permissionTx, connection);

      console.log('permissionTxSent', permissionTxSent);

      const [cumac, permissionBump] = PermissionAccount.fromSeed(
        switchboard,
        queue.authority,
        queueAccount.publicKey,
        vrfAccount.publicKey,
      );

      console.log(
        `permisson is done +++ payer token wallet is coming: ${permissionAccount.publicKey}`,
        switchboard.walletPubkey,
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
      await program.methods
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
          recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Requested RANDOMNES!');

      const result = await vrfAccount.nextResult(new BN(vrf.counter.toNumber() + 1), 45_000);

      console.log(result);

      if (!result.success) {
        throw new Error(`Failed to get VRF Result: ${result.status}`);
      }

      const vrfClientState = await program.account.vrfClientState.fetch(vrfClientKey);
      console.log('VRF CLIENT STATE IS COMIIING');
      console.log(vrfClientState);

      console.log(`Vrf client state??? ${vrfClientState}`);
      console.log(
        `Max result`,
        vrfClientState.maxResult,
        (vrfClientState.maxResult as any).toString(10),
      );
      console.log(
        `random number`,
        vrfClientState.result,
        (vrfClientState.result as any).toString(10),
      );
    })();
  });

  return <Router />;
};

export default App;

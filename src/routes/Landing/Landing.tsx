import {useState} from 'react';
import {toast} from 'react-toastify';
import {WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import {useAnchorWallet, useConnection, useWallet} from '@solana/wallet-adapter-react';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from '@solana/spl-token';
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import {findMetadataPda} from '@metaplex-foundation/js';
import {Keypair, SystemProgram, Transaction} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  web3,
  BN,
  utils,
  BorshInstructionCoder,
} from '@project-serum/anchor';
import {
  SwitchboardProgram,
  QueueAccount,
  VrfAccount,
  PermissionAccount,
  NativeMint,
} from '@switchboard-xyz/solana.js';
import StepCard from './StepCard/StepCard';
import ParticipantsModal from './ParticipantsModal/ParticipantsModal';
import {FormElement, Modal, PseudoButton} from '../../components';
import {VRFClientIDL} from '../../contracts';
import {VRF_PROGRAM_ID} from '../../utils/Constants';
import {autoEllipsis, waitUntil} from '../../utils/Helpers';

import './styles.scss';

const Landing: React.FC = () => {
  const [participantModalShown, setParticipantModalShown] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number>(-1);
  const [winnerTx, setWinnerTx] = useState('');

  const {connection} = useConnection();
  const {sendTransaction, signTransaction} = useWallet();
  const wallet = useAnchorWallet();

  const onParticipantsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.item(0);

    if (!selectedFile) {
      toast.error('No file selected!');
      return;
    }

    const reader = new FileReader();
    reader.readAsText(selectedFile, 'UTF-8');

    reader.onload = (e) => {
      const result = e.target?.result;

      if (!result || typeof result !== 'string') {
        toast.error('Selected file is not a text file!');
        return;
      }

      const entries = result.replaceAll('\r', '').split('\n');

      if (entries.length < 1) {
        toast.error('There are no participant entries in the file!');
        return;
      }

      if (entries.length === 1) {
        toast.error('There is only one participant entry in the file!');
        return;
      }

      setParticipants(entries);
      setParticipantModalShown(true);
    };

    reader.onerror = (e) => {
      toast.error('Error while reading the file!');
      console.error(e);
    };
  };

  const onShowWinnerPress = async () => {
    if (!wallet || !sendTransaction || !signTransaction) return;

    const tokenMetadata: DataV2 = {
      name: 'Raffle',
      symbol: 'Raffle',
      uri: 'https://google.com/',
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const mintKeypair = Keypair.generate();
    const metadataPDA = findMetadataPda(mintKeypair.publicKey);
    const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, wallet.publicKey);

    const createNewTokenTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey,
        TOKEN_PROGRAM_ID,
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        tokenATA,
        wallet.publicKey,
        mintKeypair.publicKey,
      ),
      createMintToInstruction(mintKeypair.publicKey, tokenATA, wallet.publicKey, 1),
      createCreateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: wallet.publicKey,
          payer: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        },
        {
          createMetadataAccountArgsV2: {
            data: tokenMetadata,
            isMutable: true,
          },
        },
      ),
    );

    await sendTransaction(createNewTokenTransaction, connection, {signers: [mintKeypair]});

    console.log('Token created!', {
      token: mintKeypair.publicKey.toBase58(),
      tokenAccount: tokenATA.toBase58(),
      metadata: tokenMetadata,
    });

    // VRF

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'processed',
    });

    const program = new Program(VRFClientIDL, VRF_PROGRAM_ID, provider);

    const switchboard = await SwitchboardProgram.load('devnet', connection);

    const vrfSecret = web3.Keypair.generate();
    const [vrfClientKey] = utils.publicKey.findProgramAddressSync(
      [Buffer.from('CLIENTSEED'), vrfSecret.publicKey.toBytes()],
      program.programId,
    );

    const [queueAccount] = await QueueAccount.load(
      switchboard,
      'F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy',
    );

    await waitUntil(queueAccount.isReady(), (isReady) => isReady);

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

    await sendTransaction(
      vrfAccountTxObject.sign(await connection.getLatestBlockhash(), [vrfSecret]),
      connection,
    );

    const initClientTx = await program.methods
      .initClient({
        maxResult: new BN(participants.length),
      })
      .accounts({
        state: vrfClientKey,
        vrf: vrfAccount.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction();

    await sendTransaction(initClientTx, connection);

    const queue = await queueAccount.loadData();
    const vrf = await vrfAccount.loadData();

    const [permissionAccount, permissionAccountTxObject] = PermissionAccount.createInstruction(
      switchboard,
      provider.wallet.publicKey,
      {
        granter: queueAccount.publicKey,
        grantee: vrfAccount.publicKey,
        authority: queue.authority,
      },
    );

    await sendTransaction(
      permissionAccountTxObject.toTxn(await connection.getLatestBlockhash()),
      connection,
    );

    const [, permissionBump] = PermissionAccount.fromSeed(
      switchboard,
      queue.authority,
      queueAccount.publicKey,
      vrfAccount.publicKey,
    );

    const Mint = await NativeMint.load(provider);

    const [payerTokenWallet] = await Mint.getOrCreateWrappedUser(provider.wallet.publicKey, {
      fundUpTo: 0.002,
    });

    const requestRandomnessTx = await program.methods
      .requestRandomness({
        switchboardStateBump: switchboard.programState.bump,
        permissionBump,
        raffleAddress: mintKeypair.publicKey,
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

    await sendTransaction(requestRandomnessTx, connection);

    const [event, , signature] = await new Promise<[any, number, string]>((resolve) => {
      program.addEventListener('VrfClientUpdated', (...args) => {
        resolve(args);
      });
    });

    setWinnerTx(signature);

    const vrfResult = event?.result?.toString?.(10);

    setWinnerIndex((parseInt(vrfResult, 10) || 0) - 1);
  };

  return (
    <div className="p-landing">
      <div className="p-landing__content w-limited w-100">
        <div className="p-landing__left">
          <StepCard
            index={1}
            title="Login With Your Wallet"
            style={{zIndex: 1}}
            flexStructure={[1, 1]}
          >
            <FormElement>
              <WalletMultiButton />
            </FormElement>
          </StepCard>

          <StepCard
            index={2}
            title="Upload Your List (TXT Format)"
            description="Every new line is evaluated as a participant"
            flexStructure={[2, 1]}
          >
            <FormElement>
              <label className="d-flex w-100">
                <input type="file" onChange={onParticipantsChange} className="hidden" />

                <PseudoButton className="button">Upload</PseudoButton>
              </label>
            </FormElement>
          </StepCard>

          <StepCard index={3} title="See the Winner" flexStructure={[1, 1]}>
            <FormElement>
              <button type="button" onClick={onShowWinnerPress}>
                Show Winner
              </button>
            </FormElement>
          </StepCard>
        </div>

        <div className="p-landing__divider" />

        <div className="p-landing__right">
          <div className="p-landing__right__header">
            <h1 className="p-landing__right__header__title">Mini Raffle</h1>
            <span className="p-landing__right__header__description">Make a Raffle in 3 steps</span>
          </div>

          <div className="p-landing__right__result">
            <h3 className="p-landing__right__result__title">RESULT:</h3>
            {winnerIndex === -1 ? (
              <span className="p-landing__right__result__description">####</span>
            ) : (
              <span className="p-landing__right__result__description">
                {winnerIndex + 1} - {autoEllipsis(participants[winnerIndex], 14)}
              </span>
            )}

            {winnerTx ? (
              <a
                href={`https://explorer.solana.com/tx/${winnerTx}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="p-landing__right__result__proof-link"
              >
                CLICK FOR PROOF
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <Modal shown={participantModalShown}>
        <ParticipantsModal
          closeModal={() => setParticipantModalShown(false)}
          participants={participants}
          clearParticipants={() => setParticipants([])}
        />
      </Modal>
    </div>
  );
};

export default Landing;

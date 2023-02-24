import {Program, AnchorProvider, web3, BN, utils} from '@project-serum/anchor';
import {useConnection, useAnchorWallet, useWallet} from '@solana/wallet-adapter-react';
import {Keypair, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import {useEffect} from 'react';
import {VRFClientIDL} from './contracts';

import Router from './routes/Router';

const programAddress = 'EmEvpcSsVwZ3VVuQEKiqiGNBYEDy52TBVz1WULdccjzA';
const programId = new PublicKey(programAddress);

const App: React.FC = () => {
  const {connection} = useConnection();
  const {sendTransaction} = useWallet();
  const anchor = useAnchorWallet();

  useEffect(() => {
    (async () => {
      if (!anchor || !sendTransaction) return;

      const provider = new AnchorProvider(connection, anchor, {
        commitment: 'processed',
      });

      const program = new Program(VRFClientIDL, programId, provider);
      const vrfAccount = web3.Keypair.generate();

      const [vrfClientKey] = utils.publicKey.findProgramAddressSync(
        [Buffer.from('CLIENTSEED'), vrfAccount.publicKey.toBytes()],
        program.programId,
      );

      console.log(vrfClientKey.toString());

      const txData = await program.methods
        .initClient({
          maxResult: new BN(1337),
        })
        .accounts({
          state: vrfClientKey,
          vrf: new PublicKey('CJhJjpS8NUf6EcSJWqCNAVXoyk5Pouu6ZLmirbNPGre7'),
          payer: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .transaction();

      console.log('txData', txData);

      const tx = await sendTransaction(txData, connection);

      console.log('tx', tx);
    })();
  });

  return <Router />;
};

export default App;

import WalletProvider from './WalletProvider';

const Providers: React.FC<{children: React.ReactNode}> = ({children}) => {
  return <WalletProvider>{children}</WalletProvider>;
};

export default Providers;

import {ToastContainer} from 'react-toastify';
import WalletProvider from './WalletProvider';

const Providers: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <WalletProvider>
      {children}

      <ToastContainer theme="dark" closeOnClick pauseOnFocusLoss pauseOnHover />
    </WalletProvider>
  );
};

export default Providers;

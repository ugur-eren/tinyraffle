import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import Providers from './Providers';
import App from './App';

import 'bootstrap/scss/bootstrap-grid.scss';
import '@csstools/normalize.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import './styles/all.scss';
import './index.scss';

const Root: React.FC = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <Providers>
          <App />
        </Providers>
      </BrowserRouter>
    </StrictMode>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as unknown as HTMLElement);

root.render(<Root />);

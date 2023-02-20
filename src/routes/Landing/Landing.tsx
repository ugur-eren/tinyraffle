import {useState} from 'react';
import {toast} from 'react-toastify';
import {WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import StepCard from './StepCard/StepCard';
import ParticipantsModal from './ParticipantsModal/ParticipantsModal';
import {Card, FormElement, Modal, PseudoButton} from '../../components';

import './styles.scss';

const Landing: React.FC = () => {
  const [participantModalShown, setParticipantModalShown] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

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
              <button type="button">Show Winner</button>
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
            <span className="p-landing__right__result__description">####</span>

            <a href="#proof" className="p-landing__right__result__proof-link">
              CLICK FOR PROOF
            </a>
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

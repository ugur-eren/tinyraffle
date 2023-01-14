import StepCard from './StepCard/StepCard';
import {FormElement} from '../../components';

import './styles.scss';

const Landing: React.FC = () => {
  return (
    <div className="p-landing">
      <div className="p-landing__content w-limited">
        <div className="p-landing__left">
          <StepCard index={1} title="Login With Sol Wallet">
            <FormElement>
              <FormElement.Button>Connect</FormElement.Button>
            </FormElement>
          </StepCard>

          <StepCard
            index={2}
            title="Upload Your List (CSV Format)"
            description="Enter How Many lines in the raffle?"
          >
            <FormElement>
              <button type="button">Upload</button>
            </FormElement>

            <FormElement>
              <FormElement.Input type="text" />
            </FormElement>
          </StepCard>

          <StepCard index={3} title="See the Winner">
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
    </div>
  );
};

export default Landing;

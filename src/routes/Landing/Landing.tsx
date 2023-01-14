import StepCard from './StepCard/StepCard';
import {FormElement} from '../../components';

import './styles.scss';

const Landing: React.FC = () => {
  return (
    <div className="p-landing">
      <div className="p-landing__content w-limited">
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
    </div>
  );
};

export default Landing;

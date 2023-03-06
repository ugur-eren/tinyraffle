import {Card, FormElement} from '../../../components';

import './styles.scss';

export type ParticipantsModalProps = {
  closeModal: () => void;
  participants: string[];
  clearParticipants: () => void;
};

const ParticipantsModal: React.FC<ParticipantsModalProps> = (props) => {
  const {closeModal, participants, clearParticipants} = props;

  const duplicateCount = participants.length - new Set(participants).size;

  return (
    <Card className="c-participants-modal h-100">
      <h1 className="mb-0">Participant entries in the selected file</h1>

      <h3 className="mb-0">Total Participants: {participants.length}</h3>

      {duplicateCount !== 0 ? (
        <h2 className="mb-0">⚠️ There are {duplicateCount} duplicate participants in the file</h2>
      ) : null}

      <ul>
        {participants.map((participant, index) => (
          <li key={participant}>
            {index + 1} - {participant}
          </li>
        ))}
      </ul>

      <div className="c-participants-modal__buttons">
        <FormElement>
          <button type="button" onClick={closeModal}>
            Looks Good
          </button>
        </FormElement>

        <FormElement>
          <button
            type="button"
            onClick={() => {
              clearParticipants();
              closeModal();
            }}
          >
            Discard
          </button>
        </FormElement>
      </div>
    </Card>
  );
};

export default ParticipantsModal;

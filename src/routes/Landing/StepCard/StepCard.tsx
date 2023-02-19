import {Card} from '../../../components';

import './styles.scss';

export type StepCardProps = JSX.IntrinsicElements['div'] & {
  children?: React.ReactNode;
  index: number;
  title: string;
  description?: string;
  flexStructure?: [number, number];
};

const StepCard: React.FC<StepCardProps> = (props) => {
  const {children, index, title, description, flexStructure = [1, 0], ...restProps} = props;

  return (
    <Card contentProps={{className: 'f-dir-row'}} {...restProps}>
      <div className="c-step-card__left" style={{flex: flexStructure[0]}}>
        <span>{index}.</span>
        <h4>{title}</h4>

        <p>{description}</p>
      </div>

      <div className="c-step-card__right" style={{flex: flexStructure[1]}}>
        {children}
      </div>
    </Card>
  );
};

export default StepCard;

import cx from 'classnames';

import './styles.scss';

export interface StepCardProps {
  children?: React.ReactNode;
  className?: string;
  index: number;
  title: string;
  description?: string;
}

const StepCard: React.FC<StepCardProps> = (props) => {
  const {children, className, index, title, description} = props;

  return (
    <div className={cx('c-step-card', className)}>
      <div className="c-step-card__border" />

      <div className="c-step-card__content">
        <div className="c-step-card__content__left">
          <span>{index}.</span>
          <h4>{title}</h4>

          <p>{description}</p>
        </div>

        <div className="c-step-card__content__right">{children}</div>
      </div>
    </div>
  );
};

export default StepCard;

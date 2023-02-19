import cx from 'classnames';

import './styles.scss';

export type CardProps = JSX.IntrinsicElements['div'] & {
  contentProps?: JSX.IntrinsicElements['div'];
};

const Card: React.FC<CardProps> = ({children, className, contentProps, ...props}) => {
  return (
    <div className={cx('c-card', className)} {...props}>
      <div className="c-card__border" />

      <div {...contentProps} className={cx('c-card__content', contentProps?.className)}>
        {children}
      </div>
    </div>
  );
};

export default Card;

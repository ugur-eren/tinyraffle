import {forwardRef} from 'react';
import cx from 'classnames';

import './styles.scss';

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  containerProps?: JSX.IntrinsicElements['div'];
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {children, className, containerProps, ...restProps} = props;

  return (
    <div {...containerProps} className={cx('c-button', containerProps?.className)}>
      <div className="c-button__border" />

      <button ref={ref} type="button" className={cx('c-button__content', className)} {...restProps}>
        {children}
      </button>
    </div>
  );
});

export default Button;

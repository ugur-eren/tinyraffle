import {forwardRef} from 'react';
import cx from 'classnames';

import './styles.scss';

export type FormElementProps = JSX.IntrinsicElements['div'];

const FormElement = forwardRef<HTMLDivElement, FormElementProps>((props, ref) => {
  const {children, className, ...restProps} = props;

  return (
    <div className={cx('c-form-element', className)} ref={ref} {...restProps}>
      <div className="c-form-element__border" />

      {children}
    </div>
  );
});

export default FormElement;

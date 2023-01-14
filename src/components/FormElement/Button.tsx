import {forwardRef} from 'react';

export type FormElementButtonProps = JSX.IntrinsicElements['button'];

const FormElementButton = forwardRef<HTMLButtonElement, FormElementButtonProps>((props, ref) => {
  const {children, ...restProps} = props;

  return (
    <button type="button" ref={ref} {...restProps}>
      {children}
    </button>
  );
});

export default FormElementButton;

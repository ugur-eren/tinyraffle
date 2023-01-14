import {forwardRef} from 'react';

export type FormElementInputProps = JSX.IntrinsicElements['input'];

const FormElementInput = forwardRef<HTMLInputElement, FormElementInputProps>((props, ref) => {
  return <input type="text" placeholder="_ _ _ _" ref={ref} {...props} />;
});

export default FormElementInput;

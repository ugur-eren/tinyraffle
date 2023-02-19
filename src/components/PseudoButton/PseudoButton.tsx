import {useRef, useState} from 'react';

const PseudoButton: React.FC<JSX.IntrinsicElements['div']> = (props) => {
  const {children, onKeyDown, ...restProps} = props;

  const elRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      elRef.current?.click();
      setPressed((value) => !value);
    }

    onKeyDown?.(event);
  };

  return (
    <div
      ref={elRef}
      role="button"
      tabIndex={0}
      aria-pressed={pressed}
      onKeyDown={handleKeyDown}
      onBlur={() => setPressed(false)}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default PseudoButton;

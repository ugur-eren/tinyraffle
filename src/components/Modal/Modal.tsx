import {createPortal} from 'react-dom';
import cx from 'classnames';

import './styles.scss';

export type ModalProps = JSX.IntrinsicElements['div'] & {
  /**
   * Whether the modal is visible or not. Defaults to true.
   */
  shown?: boolean;
};

const Modal: React.FC<ModalProps> = (props) => {
  const {shown = true, children, className, ...restProps} = props;

  const elm = document.getElementById('root-modal');

  if (!elm || !shown) return null;

  return createPortal(
    <div className="c-modal fixed-fill">
      <div className="c-modal__container w-limited">
        <div className={cx('c-modal__content', className)} {...restProps}>
          {children}
        </div>
      </div>
    </div>,
    elm,
  );
};

export default Modal;

import cx from 'classnames';

type Column = number | 'auto';

interface Props {
  children?: React.ReactNode;
  className?: string;
  span?: Column;
  sm?: Column;
  md?: Column;
  lg?: Column;
  xl?: Column;
  xxl?: Column;
}

const Col: React.FC<Props> = (props) => {
  const {children, className, span = 0, sm = 0, md = 0, lg = 0, xl = 0, xxl = 0} = props;

  return (
    <div
      className={cx(
        {[`col-${span}`]: !!span},
        {[`col-sm-${sm}`]: !!sm},
        {[`col-md-${md}`]: !!md},
        {[`col-lg-${lg}`]: !!lg},
        {[`col-xl-${xl}`]: !!xl},
        {[`col-xxl-${xxl}`]: !!xxl},
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Col;

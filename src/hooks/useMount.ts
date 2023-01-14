import {useEffect} from 'react';

const useMount = (effect: React.EffectCallback) => {
  useEffect(effect, []);
};

export default useMount;

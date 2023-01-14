import {Route, Routes} from 'react-router-dom';
import Paths from './Paths';

import Landing from './Landing/Landing';

const Router: React.FC = () => (
  <Routes>
    <Route path={Paths.Landing} element={<Landing />} />
  </Routes>
);

export default Router;

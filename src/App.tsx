import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './app/router/router';

const App = () => {
     return (
          <>
               <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
               <RouterProvider router={router} />
          </>
     );
};

export default App;

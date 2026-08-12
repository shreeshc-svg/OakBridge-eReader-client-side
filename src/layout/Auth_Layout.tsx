import { Outlet } from 'react-router-dom';

const Auth_Layout = () => {
     return (
          <div
               className="auth-layout"
               style={{
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    backgroundColor: '#ffffff',
               }}
          >
               <main
                    style={{
                         flex: 1,
                         display: 'flex',
                         width: '100%',
                         minHeight: '100vh',
                    }}
               >
                    <Outlet />
               </main>
          </div>
     );
};

export default Auth_Layout;

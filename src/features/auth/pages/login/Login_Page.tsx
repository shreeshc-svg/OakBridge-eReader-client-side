import Login_Left_Panel from '../../components/login_left_panel/Login_Left_Panel';
import Login_Right_Panel from '../../components/login_right_panel/Login_Right_Panel';
import './Login_Page.scss';
import type { AuthPageData } from '../../types/login.types';

export interface LoginPageProps {
     data?: AuthPageData;
}

const Login_Page = ({ data }: LoginPageProps) => {
     return (
          <div className="login_page">
               <div className="login_page__container">
                    <div className="login_page__container__left_panel">
                         <Login_Left_Panel />
                    </div>
                    <div>
                         <Login_Right_Panel
                              data={data?.login?.login_right_panel}
                         />
                    </div>
               </div>
          </div>
     );
};

export default Login_Page;

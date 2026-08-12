import Login_Left_Panel from '../../components/login_left_panel/Login_Left_Panel';
import Signup_Right_Panel from '../../components/signup_right_panel/Signup_Right_Panel';
import './Signup_Page.scss';
import type { AuthPageData } from '../../types/login.types';

export interface SignupPageProps {
     data?: AuthPageData;
}

const Signup_Page = ({ data }: SignupPageProps) => {
     return (
          <div className="signup_page">
               <div className="signup_page__container">
                    <div className="signup_page__container__left_panel">
                         <Login_Left_Panel />
                    </div>
                    <div>
                         <Signup_Right_Panel
                              data={data?.signup?.signup_right_panel}
                         />
                    </div>
               </div>
          </div>
     );
};

export default Signup_Page;

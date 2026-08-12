import './Login_Left_Panel.scss';

const Login_Left_Panel = () => {
     return (
          <div className="login_left_panel">
               {/* Slanted book-cover grid background */}
               <div className="login_left_panel__bg_grid" aria-hidden="true">
                    <div className="book-card book-card--1"></div>
                    <div className="book-card book-card--2"></div>
                    <div className="book-card book-card--3"></div>
                    <div className="book-card book-card--4"></div>
                    <div className="book-card book-card--5"></div>
                    <div className="book-card book-card--6"></div>
                    <div className="book-card book-card--7"></div>
                    <div className="book-card book-card--8"></div>
                    <div className="book-card book-card--9"></div>
               </div>

               {/* Forefront Content */}
               <div className="login_left_panel__content">
                    <header className="login_left_panel__logo">
                         <span className="brand-name">Oakbridge</span>
                         <span className="brand-badge">READER</span>
                    </header>

                    <div className="login_left_panel__middle">
                         <h1 className="login_left_panel__heading">
                              Your library,<br />
                              <span className="accent-text">everywhere.</span>
                         </h1>
                         <p className="login_left_panel__subtext">
                              Access every Oakbridge title you own — securely, in your browser, with your highlights and notes always synced.
                         </p>
                    </div>

                    <footer className="login_left_panel__footer">
                         A reading environment built for scholars, professionals, and the intellectually restless.
                    </footer>
               </div>
          </div>
     );
};

export default Login_Left_Panel;

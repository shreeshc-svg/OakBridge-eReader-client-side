export interface LoginLeftPanelData {
     image_url: string;
}

export interface LoginRightPanelForm {
     email_placeholder: string;
     password_placeholder: string;
     forgot_password_text: string;
     login_button_text: string;
     loading_button_text: string;
}

export interface SignupRightPanelForm {
     username_placeholder: string;
     email_placeholder: string;
     password_placeholder: string;
     role_label: string;
     otp_placeholder: string;
     send_otp_button_text: string;
     sending_otp_button_text: string;
     verify_otp_button_text: string;
     next_button_text: string;
     back_button_text: string;
     signup_button_text: string;
     loading_button_text: string;
}

export interface AuthRightPanelSocialButtons {
     google_text: string;
     facebook_text: string;
}

export interface AuthRightPanelFooter {
     text: string;
     link_text: string;
}

export interface LoginRightPanelData {
     logo_text: string;
     title: string;
     sub_title: string;
     form: LoginRightPanelForm;
     divider_text: string;
     social_buttons: AuthRightPanelSocialButtons;
     footer: AuthRightPanelFooter;
     messages: {
          login_success: string;
          login_failed: string;
     };
}

export interface SignupRightPanelData {
     logo_text: string;
     title: string;
     sub_title: string;
     form: SignupRightPanelForm;
     divider_text: string;
     social_buttons: AuthRightPanelSocialButtons;
     footer: AuthRightPanelFooter;
     messages: {
          otp_sent_success: string;
          otp_sent_failed: string;
          signup_success: string;
          signup_failed: string;
     };
}

export interface AuthPageData {
     login: {
          login_left_panel: LoginLeftPanelData;
          login_right_panel: LoginRightPanelData;
     };
     signup: {
          signup_left_panel: LoginLeftPanelData;
          signup_right_panel: SignupRightPanelData;
     };
}

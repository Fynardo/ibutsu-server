import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormAlert,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  LoginMainFooterBandItem,
  LoginPage,
  TextInput
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { NavLink } from 'react-router-dom';

import { AuthService } from './services/auth';

// Lazy import the password strength indicator, it uses a very big library
const PasswordStrengthBar = React.lazy(() => import ('react-password-strength-bar'));


// This catches any potential errors if the password strength indicator fails to load
class PasswordErrorBoundary extends React.Component {
  static propTypes = {
    children: PropTypes.node
  };

  constructor (props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError () {
    return { hasError: true };
  }

  componentDidCatch () {
    console.error('Failed to load password strength indicator');
  }

  render () {
    if (this.state.hasError) {
      // Hide the components, we don't need to worry about it
      return '';
    }
    return this.props.children;
  }
}


export class ResetPassword extends React.Component {
  static propTypes = {
    location: PropTypes.object,
    params: PropTypes.object
  };

  constructor (props) {
    super(props);
    this.state = {
      activationCode: props.params.activationCode,
      alertText: '',
      alertType: '',
      showAlert: false,
      passwordValue: '',
      isValidPassword: true,
      isPasswordVisible: false,
      confirmPasswordValue: '',
      confirmPasswordHelpText: '',
      confirmPasswordValidation: 'default',
      isConfirmPasswordVisible: false
    };
  }

  validatePasswordMatch = () => {
    if (this.state.confirmPasswordValue === '' && this.state.passwordValue === '') {
      this.setState({
        confirmPasswordHelpText: '',
        confirmPasswordValidation: 'default'
      });
    }
    else if (this.state.passwordValue === this.state.confirmPasswordValue) {
      this.setState({
        confirmPasswordHelpText: 'Passwords match!',
        confirmPasswordValidation: 'success'
      });
    }
    else if (this.state.passwordValue !== this.state.confirmPasswordValue) {
      this.setState({
        confirmPasswordValidation: 'error'
      });
    }
  };

  onPasswordChange = passwordValue => {
    this.setState({ passwordValue }, this.validatePasswordMatch);
  };

  onConfirmPasswordChange = confirmPasswordValue => {
    this.setState({ confirmPasswordValue }, this.validatePasswordMatch);
  };

  onPasswordVisibleClick = () => {
    this.setState({isPasswordVisible: !this.state.isPasswordVisible});
  };

  onConfirmPasswordVisibleClick = () => {
    this.setState({isConfirmPasswordVisible: !this.state.isConfirmPasswordVisible});
  };

  onResetButtonClick = event => {
    event.preventDefault();
    var isValidPassword = !!this.state.passwordValue;
    this.setState({isValidPassword});
    if (isValidPassword) {
      AuthService.resetPassword(this.state.activationCode, this.state.passwordValue)
        .then(isSuccess => {
          if (isSuccess) {
            this.setState({
              alertText: 'Your password has been reset. You can now login with your new password',
              alertType: 'success',
              showAlert: true
            });
          }
          else {
            this.setState({
              alertText: AuthService.resetError.message,
              alertType: 'danger',
              showAlert: true
            });
          }
        })
        .catch(error => {
          this.setState({
            alertText: error,
            alertType: 'danger',
            showAlert: true
          });
        });
    }
    else {
      this.setState({
        alertText: 'Password fields are empty',
        alertType: 'danger',
        showAlert: true
      });
    }
  };

  render () {
    const loginMessage = (
      <LoginMainFooterBandItem>
        Already registered? <NavLink to="/login">Log in.</NavLink>
      </LoginMainFooterBandItem>
    );
    const forgotCredentials = (
      <LoginMainFooterBandItem>
        <NavLink to="/forgot-password">Forgot username or password?</NavLink>
      </LoginMainFooterBandItem>
    );

    const backgroundImages = {
      lg: '/images/pfbg_1200.jpg',
      sm: '/images/pfbg_768.jpg',
      sm2x: '/images/pfbg_768@2x.jpg',
      xs: '/images/pfbg_576.jpg',
      xs2x: '/images/pfbg_576@2x.jpg'
    };

    return (
      <LoginPage
        footerListVariants="inline"
        brandImgSrc="/images/ibutsu-wordart-164.png"
        brandImgAlt="Ibutsu"
        backgroundImgSrc={backgroundImages}
        textContent="Ibutsu is an open source test result aggregation. Collect and display your test results, view artifacts, and monitor tests."
        loginTitle="Reset your password"
        loginSubtitle="Please type in a secure password"
        signUpForAccountMessage={loginMessage}
        forgotCredentials={forgotCredentials}
      >
        <Form>
          {this.state.showAlert &&
          <FormAlert>
            <Alert variant={this.state.alertType} title={this.state.alertText} aria-live="polite" isInline/>
          </FormAlert>
          }
          <FormGroup
            label="Password"
            isRequired
            fieldId="password"
            validated={this.state.isValidPassword ? 'default' : 'error'}
          >
            <InputGroup>
              {!this.state.isPasswordVisible &&
              <TextInput
                isRequired
                type="password"
                id="password"
                name="password"
                validated={this.state.isValidPassword ? 'default' : 'error'}
                aria-describedby="password-helper"
                value={this.state.passwordValue}
                onChange={(_event, passwordValue) => this.onPasswordChange(passwordValue)} />
              }
              {this.state.isPasswordVisible &&
              <TextInput
                isRequired
                type="text"
                id="password"
                name="password"
                validated={this.state.isValidPassword ? 'default' : 'error'}
                aria-describedby="password-helper"
                value={this.state.passwordValue}
                onChange={(_event, passwordValue) => this.onPasswordChange(passwordValue)} />}
              <InputGroupItem><Button variant="control" aria-label="Show password" onClick={this.onPasswordVisibleClick}>
                {!this.state.isPasswordVisible && <EyeIcon/>}
                {this.state.isPasswordVisible && <EyeSlashIcon/>}
              </Button></InputGroupItem>
            </InputGroup>
            <PasswordErrorBoundary>
              <Suspense fallback="">
                <PasswordStrengthBar password={this.state.passwordValue}/>
              </Suspense>
            </PasswordErrorBoundary>
          </FormGroup>
          <FormGroup
            label="Confirm password"
            isRequired
            fieldId="confirm-password"
          >
            <InputGroup>
              {!this.state.isConfirmPasswordVisible && <TextInput isRequired type="password" id="confirm-password" name="confirm-password" aria-describedby="confirm-password-helper" value={this.state.confirmPasswordValue} onChange={(_event, confirmPasswordValue) => this.onConfirmPasswordChange(confirmPasswordValue)} validated={this.state.confirmPasswordValidation} />}
              {this.state.isConfirmPasswordVisible && <TextInput isRequired type="text" id="confirm-password" name="confirm-password" aria-describedby="confirm-password-helper" value={this.state.confirmPasswordValue} onChange={(_event, confirmPasswordValue) => this.onConfirmPasswordChange(confirmPasswordValue)} validated={this.state.confirmPasswordValidation} />}
              <InputGroupItem>
                <Button variant="control" aria-label="Show password" onClick={this.onConfirmPasswordVisibleClick}>
                  {!this.state.isConfirmPasswordVisible && <EyeIcon/>}
                  {this.state.isConfirmPasswordVisible && <EyeSlashIcon/>}
                </Button>
              </InputGroupItem>
            </InputGroup>
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={this.state.confirmPasswordValidation}>{this.state.confirmPasswordHelpText}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <ActionGroup>
            <Button variant="primary" isBlock onClick={this.onResetButtonClick}>Reset Password</Button>
          </ActionGroup>
        </Form>
      </LoginPage>
    );
  }
}

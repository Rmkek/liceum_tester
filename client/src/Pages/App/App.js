import React, { Component } from 'react'
import {
  Button,
  Col,
  Row,
  FormGroup,
  Form,
  Modal,
  Label,
  Input,
  ModalHeader,
  ModalBody,
  ModalFooter,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Container
} from 'reactstrap'
import './App.css'
import { Redirect } from 'react-router-dom'
import * as AUTH_CONSTANTS from '../../Backend_answers/AuthConstants'
import Spinner from '../../Reusables/Spinner/Spinner'

class App extends Component {
  constructor () {
    super()

    this.state = {
      email_value: '',
      password_value: '',
      modal_shown: false,
      modal_title: '',
      modal_text: '',
      contact_link: '',
      redirect: false,
      is_loading: true
    }

    window.fetch(`api/checkForLogin`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    })
      .then(response => response.json())
      .then(resp => {
        if (resp === AUTH_CONSTANTS.NOT_LOGGED_IN) {
          console.log('Not logged in')
          this.setState({ is_loading: false })
        } else {
          this.setState({
            is_loading: false,
            redirect: true
          })
        }
      })

    document.onkeypress = e => {
      if (e.keyCode === 13 && this.state.modal_shown) {
        e.preventDefault()
        this.setState({ modal_shown: !this.state.modal_shown })
      } else if (
        e.keyCode === 13 &&
        this.state.email_value !== '' &&
        this.state.password_value !== '' &&
        this.getEmailValidationState() &&
        this.getPasswordValidationState()
      ) {
        e.preventDefault()
        this.authCallback()
      }
    }
  }

  getEmailValidationState = () => {
    // eslint-disable-next-line
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (this.state.email_value === '') return null
    return !!re.test(this.state.email_value)
  };

  getPasswordValidationState = () => {
    return this.state.password_value.length === 0 ? null : this.state.password_value.length >= 6
  };

  handleEmailChange = (e) => {
    this.setState({ email_value: e.target.value })
  };

  handlePasswordChange = (e) => {
    this.setState({ password_value: e.target.value })
  };

  closeModal = (e) => {
    this.setState({ modal_shown: false })
  };

  authCallback = () => {
    if (this.state.email_value !== '' && this.state.password_value !== '' && this.validateEmail(this.state.email_value)) {
      return window.fetch(`api/auth`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          email: this.state.email_value,
          pass: this.state.password_value
        })
      }).then(response => {
        if (response.status >= 200 && response.status < 300) {
          console.log('Successfully logged in.')
          this.setState({ redirect: true })
          return response
        } else {
          response.json().then(response => {
            switch (response.error) {
              case AUTH_CONSTANTS.USER_IS_NOT_APPROVED:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Your e-mail is not yet approved. Wait for teacher to approve it.'
                })
                break
              case AUTH_CONSTANTS.WRONG_PASSWORD:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Wrong password.'
                })
                break
              case AUTH_CONSTANTS.USER_IS_NOT_REGISTERED:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'User is not registered. Try pressing register button and waiting for approval.'
                })
                break
              default:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Something really, really bad mumbo-jumbo happened. Immediately report it to ',
                  contact_link: (
                    <a href='mailto:malyshkov.roman@gmail.com?subject=Liceum Tester'>
                    Roman Malyshkov
                    </a>
                  )
                })
                break
            }
            this.setState({ modal_shown: true })
          })
        }
      })
    }
  };

  registerCallback = () => {
    if (this.state.email_value !== '' && this.state.password_value !== '' && this.validateEmail(this.state.email_value)) {
      return window.fetch(`api/register`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          email: this.state.email_value,
          pass: this.state.password_value
        })
      }).then(response => {
        if (response.status === 200) {
          this.setState({
            modal_title: 'Registration successful',
            modal_text: "Wait for teacher to approve your registration, until that you won't be able to log in.",
            modal_shown: true
          })
          return response
        } else {
          response.json().then(response => {
            switch (response) {
              case AUTH_CONSTANTS.WRONG_EMAIL:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Wrong email content. Use correct email address.'
                })
                break
              case AUTH_CONSTANTS.EMAIL_ALREADY_IN_DB:
                this.setState({
                  modal_title: 'Error',
                  modal_text:
                    'Email is already listed in database. Wait for teacher to approve it, or (if you have been approved), try pressing Log in button.'
                })
                break
              case AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Some backend exception happened. Report this incident to your teacher or to ',
                  contact_link: (
                    <a href='mailto:malyshkov.roman@gmail.com?subject=Liceum Tester'>
                    Roman Malyshkov
                    </a>
                  )
                })
                break
              default:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Something really, really bad mumbo-jumbo happened. Immediately report it to ',
                  contact_link: (
                    <a href='mailto:malyshkov.roman@gmail.com?subject=Liceum Tester'>
                    Roman Malyshkov
                    </a>
                  )
                })
            }
            this.setState({ modal_shown: true })
          })
        }
      })
    }
  };

  render () {
    if (this.state.is_loading) {
      return <Spinner />
    }

    if (this.state.redirect) {
      return (
        <Redirect
          to={{
            pathname: '/add-info',
            state: { email: this.state.email_value }
          }}
        />
      )
    }

    return (
      <div>
        <div className='modal-container'>
          <Modal isOpen={this.state.modal_shown} onClick={this.closeModal}>
            <ModalHeader toggle={this.closeModal}>{this.state.modal_title}</ModalHeader>
            <ModalBody>
              {this.state.modal_text}
              {this.state.contact_link}
            </ModalBody>
            <ModalFooter>
              <Button onClick={this.closeModal}>Close</Button>
            </ModalFooter>
          </Modal>
        </div>
        <Container>
          <Row className='vertical-center'>
            <Col xl={{size: 4, offset: 4}} lg={{ size: 4, offset: 4 }} md={{ size: 5, offset: 4 }} sm={{size: 6, offset: 3}} xs={{size: 8, offset: 2}} className='auth-container'>
              <Form>
                <FormGroup>
                  <Label for='email_input'> Enter your E-mail address: </Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>
                      <InputGroupText>
                        <i className='fa fa-envelope fa' aria-hidden='true' />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input
                      id='email_input'
                      type='email'
                      name='email'
                      valid={this.getEmailValidationState()}
                      value={this.state.email_value}
                      onChange={this.handleEmailChange}
                      placeholder='Your e-mail'
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for='password_input'> Enter your password: </Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>
                      <InputGroupText>
                        <i className='fa fa-lock fa-lg' aria-hidden='true' />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input
                      type='password'
                      name='password'
                      valid={this.getPasswordValidationState()}
                      value={this.state.password_value}
                      onChange={this.handlePasswordChange}
                      placeholder='Your password'
                    />
                  </InputGroup>
                </FormGroup>
              </Form>
              <Button color='primary' size='md' block onClick={this.registerCallback}>
                Register
              </Button>
              <Button color='primary' size='md' block onClick={this.authCallback}>
                Log in
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }

  validateEmail = (email) => {
    // eslint-disable-next-line
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(this.state.email_value)
  };
}

export default App

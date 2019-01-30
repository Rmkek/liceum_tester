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
import './RegisterUser.css'
import { Redirect } from 'react-router-dom'
import * as AUTH_CONSTANTS from '../../Backend_answers/AuthConstants'
import Spinner from '../../Reusables/Spinner/Spinner'

class RegisterUser extends Component {
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
      redirect_url: '',
      is_loading: true,
      teachers: [],
      teacher_value: '',
      first_name_value: '',
      last_name_value: '',
      patronymic: ''
    }

    window.fetch('api/getTeachersList', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    }).then(res => res.json())
      .then(json => {
        let keyIter = 0
        let teachersArr = this.state.teachers
        json.forEach(teacher => {
          teachersArr.push(<option key={keyIter}>{teacher}</option>)
          keyIter++
        })
        console.log('jsonteachers: ', json)
        this.setState({teacher_value: json[0],
          teachers: teachersArr,
          is_loading: false})
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

  getUserNameValidationState = () => {
    return this.state.first_name_value.length === 0 ? null : this.state.first_name_value.length > 0
  }

  getLastNameValidationState = () => {
    return this.state.last_name_value.length === 0 ? null : this.state.last_name_value.length > 0
  }

  getPatronymicValidationState = () => {
    return this.state.patronymic.length === 0 ? null : this.state.patronymic.length > 0
  }

  handleEmailChange = (e) => {
    this.setState({ email_value: e.target.value })
  };

  handlePasswordChange = (e) => {
    this.setState({ password_value: e.target.value })
  };

  handleNameChange = (e) => {
    this.setState({ first_name_value: e.target.value })
  }

  handleLastNameChange = (e) => {
    this.setState({ last_name_value: e.target.value })
  }

  handlePatronymicChange = (e) => {
    this.setState({ patronymic: e.target.value })
  }

  handleTeacherChange = (e) => {
    this.setState({ teacher_value: e.target.value })
  }

  closeModal = (e) => {
    this.setState({ modal_shown: false })
  };

  registerCallback = () => {
    if (this.state.email_value !== '' && this.state.password_value !== '' &&
     this.validateEmail(this.state.email_value) && this.teacher_value !== '' &&
     this.state.first_name_value !== '' && this.state.last_name_value !== '' && this.state.patronymic !== '') {
      return window.fetch(`api/register`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          email: this.state.email_value,
          first_name: this.state.first_name_value,
          last_name: this.state.last_name_value,
          patronymic: this.state.patronymic,
          pass: this.state.password_value,
          teacher: this.state.teacher_value,
          type: 'USER'
        })
      }).then(response => {
        if (response.status === 200) {
          this.setState({
            modal_title: 'Registration successful',
            modal_text: "Wait for teacher to approve your registration, until that you won't be able to log in.",
            modal_shown: true,
            contact_link: '',
            redirect: true,
            redirect_url: '/'
          })
          return response
        } else {
          response.json().then(response => {
            switch (response) {
              case AUTH_CONSTANTS.WRONG_EMAIL:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Wrong email content. Use correct email address.',
                  modal_shown: true
                })
                break
              case AUTH_CONSTANTS.EMAIL_ALREADY_IN_DB:
                this.setState({
                  modal_title: 'Error',
                  modal_text:
                    'Email is already listed in database. Wait for teacher to approve it, or (if you have been approved), try pressing Log in button.',
                  modal_shown: true
                })
                break
              case AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'Some backend exception happened. Report this incident to your teacher or to ',
                  contact_link: (
                    <a href='mailto:malyshkov.roman@gmail.com?subject=TestMyCode'>
                    Roman Malyshkov
                    </a>
                  ),
                  modal_shown: true
                })
                break
              default:
                this.setState({
                  modal_title: 'Error',
                  modal_text: 'OOPSIE WOOPSIE!! Uwu We made a fucky wucky!! A wittle fucko boingo! The code monkeys at our headquarters are working VEWY HAWD to fix this!',
                  contact_link: (
                    <a href='mailto:malyshkov.roman@gmail.com?subject=TestMyCode'>
                    Roman Malyshkov
                    </a>
                  ),
                  modal_shown: true
                })
            }
          })
        }
      })
    }
  }

  render () {
    if (this.state.is_loading) {
      return <Spinner />
    }

    if (!this.state.modal_shown && this.state.redirect) {
      return (
        <Redirect
          to={{
            pathname: this.state.redirect_url,
            state: { email: this.state.email_value }
          }}
        />
      )
    }

    return (
      <div>
        <div className='modal-container'>
          <Modal isOpen={this.state.modal_shown} onClick={this.closeModal} backdrop='static'>
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
                  <Label for='name'> Enter your first name: </Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>
                      <InputGroupText>
                        <i className='fas fa-user-circle' aria-hidden='true' />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input
                      id='firstName'
                      name='text'
                      valid={this.getUserNameValidationState()}
                      value={this.state.first_name_value}
                      onChange={this.handleNameChange}
                      placeholder='Your name'
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for='name'> Enter your last name: </Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>
                      <InputGroupText>
                        <i className='fas fa-user-circle' aria-hidden='true' />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input
                      id='secondName'
                      name='text'
                      valid={this.getLastNameValidationState()}
                      value={this.state.last_name_value}
                      onChange={this.handleLastNameChange}
                      placeholder='Your last name'
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for='name'> Enter your patronymic: </Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>
                      <InputGroupText>
                        <i className='fas fa-user-circle' aria-hidden='true' />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input
                      id='patronymic'
                      name='text'
                      valid={this.getPatronymicValidationState()}
                      value={this.state.patronymic}
                      onChange={this.handlePatronymicChange}
                      placeholder='Your patronymic'
                    />
                  </InputGroup>
                </FormGroup>
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
                <FormGroup>
                  <Label for='selectTeacher'>Select your teacher</Label>
                  <InputGroup>
                    <InputGroupAddon addonType='prepend'>
                      <InputGroupText>
                        <i className='fas fa-user' aria-hidden='true' />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input type='select' name='select' id='selectTeacher' value={this.state.teacher_value}
                      onChange={this.handleTeacherChange} placeholder='Your teacher'>
                      {this.state.teachers}
                    </Input>
                  </InputGroup>
                </FormGroup>
              </Form>
              <Button color='primary' size='md' block onClick={this.registerCallback}>
                Register
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

export default RegisterUser

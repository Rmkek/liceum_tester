import React, { Component } from "react";
import {
  Button,
  Col,
  Row,
  ButtonToolbar,
  FormControl,
  FormGroup,
  ControlLabel,
  Form,
  Modal
} from "react-bootstrap";
import "./App.css";
import { Redirect } from "react-router-dom";
import * as AUTH_CONSTANTS from "./Backend_answers/AuthConstants";
const base64 = require("base-64");

class App extends Component {
  constructor() {
    super();
    console.log("document: ", document.getElementsByClassName("auth-email"));

    fetch(`api/checkForLogin`, {
      accept: "application/json",
      credentials: "include"
    })
      .then(response => response.json())
      .then(resp => {
        if (resp.success === AUTH_CONSTANTS.NOT_LOGGED_IN) {
          console.log("Not logged in");
        } else {
          this.setState({ logged_in: true });
        }
      });

    this.state = {
      email_value: "",
      password_value: "",
      modal_shown: false,
      modal_title: "",
      modal_text: "",
      vk_link: "",
      logged_in: false
    };

    document.onkeypress = e => {
      if (e.keyCode === 13 && this.state.modal_shown) {
        // Enter Keycode
        e.preventDefault();
        this.setState({ modal_shown: !this.state.modal_shown });
      } else if (
        e.keyCode === 13 &&
        this.state.email_value !== "" &&
        this.state.password_value !== "" &&
        this.validateEmail(this.state.email_value)
      ) {
        e.preventDefault();
        this.authCallback();
      }
    };
  }

  getEmailValidationState = () => {
    // eslint-disable-next-line
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (this.state.email_value === "") return null;
    return re.test(this.state.email_value) ? "success" : "error";
  };

  handleEmailChange = e => {
    this.setState({ email_value: e.target.value });
  };

  handlePasswordChange = e => {
    this.setState({ password_value: e.target.value });
  };

  closeModal = e => {
    this.setState({ modal_shown: false });
  };

  authCallback = () => {
    if (
      this.state.email_value !== "" &&
      this.state.password_value !== "" &&
      this.validateEmail(this.state.email_value)
    ) {
      return fetch(
        `api/auth?email=${base64.encode(
          this.state.email_value
        )}&pass=${base64.encode(this.state.password_value)}`,
        {
          accept: "application/json",
          credentials: "include"
        }
      ).then(response => {
        if (response.status >= 200 && response.status < 300) {
          console.log("Successfully logged in.");
          this.setState({ logged_in: true });
          return response;
        } else {
          response.json().then(response => {
            switch (response.error) {
              case AUTH_CONSTANTS.USER_IS_NOT_APPROVED:
                this.setState({
                  modal_title: "Error",
                  modal_text:
                    "Your e-mail is not yet approved. Wait for teacher to approve it."
                });
                break;
              case AUTH_CONSTANTS.WRONG_PASSWORD:
                this.setState({
                  modal_title: "Error",
                  modal_text: "Wrong password."
                });
                break;
              case AUTH_CONSTANTS.USER_IS_NOT_REGISTERED:
                this.setState({
                  modal_title: "Error",
                  modal_text:
                    "User is not registered. Try pressing register button and waiting for approval."
                });
                break;
              default:
                this.setState({
                  modal_title: "Error",
                  modal_text:
                    "Something really, really bad mumbo-jumbo happened. Immediately report it to ",
                  vk_link: (
                    <a
                      href="https://vk.com/rmk1337"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Kirill Pavidlov
                    </a>
                  )
                });
                break;
            }
            this.setState({ modal_shown: true });
          });
        }
      });
    }
  };

  registerCallback = () => {
    if (
      this.state.email_value !== "" &&
      this.state.password_value !== "" &&
      this.validateEmail(this.state.email_value)
    ) {
      return fetch(
        `api/register?email=${base64.encode(
          this.state.email_value
        )}&pass=${base64.encode(this.state.password_value)}`,
        {
          accept: "application/json",
          credentials: "include"
        }
      ).then(response => {
        if (response.status === 200) {
          this.setState({
            modal_title: "Registration successful",
            modal_text:
              "Wait for teacher to approve your registration, until that you won't be able to log in."
          });
          this.setState({ modal_shown: true });
          return response;
        } else {
          response.json().then(response => {
            switch (response.error) {
              case AUTH_CONSTANTS.WRONG_EMAIL:
                this.setState({
                  modal_title: "Error",
                  modal_text: "Wrong email content. Use correct email address."
                });
                break;
              case AUTH_CONSTANTS.EMAIL_ALREADY_IN_DB:
                this.setState({
                  modal_title: "Error",
                  modal_text:
                    "Email is already listed in database. Wait for teacher to approve it."
                });
                break;
              case AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION:
                this.setState({
                  modal_title: "Error",
                  modal_text:
                    "Some backend exception happened. Report this incident to your teacher or to ",
                  vk_link: (
                    <a
                      href="https://vk.com/rmk1337"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Kirill Pavidlov
                    </a>
                  )
                });
                break;
              default:
                this.setState({
                  modal_title: "Error",
                  modal_text:
                    "Something really, really bad mumbo-jumbo happened. Immediately report it to ",
                  vk_link: (
                    <a
                      href="https://vk.com/rmk1337"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Kirill Pavidlov
                    </a>
                  )
                });
            }
            this.setState({ modal_shown: true });
          });
        }
      });
    }
  };

  render() {
    return !this.state.logged_in ? (
      <div className="auth-page">
        <div className="modal-container">
          <Modal
            show={this.state.modal_shown}
            onHide={this.closeModal}
            container={this}
            aria-labelledby="contained-modal-title"
          >
            <Modal.Header closeButton>
              <Modal.Title id="contained-modal-title">
                {this.state.modal_title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {this.state.modal_text}
              {this.state.vk_link}
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.closeModal}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
        <Col xs={12} md={12}>
          <Row>
            <Col
              lg={2}
              lgOffset={5}
              md={4}
              mdOffset={4}
              xs={4}
              xsOffset={4}
              className="auth-container"
            >
              <Form>
                <FormGroup
                  className="auth-email"
                  controlId="formBasicText"
                  validationState={this.getEmailValidationState()}
                >
                  <ControlLabel> Enter your E-mail address: </ControlLabel>
                  <FormControl
                    type="email"
                    value={this.state.email_value}
                    onChange={this.handleEmailChange}
                    placeholder="Your e-mail"
                  />
                  <FormControl.Feedback />
                </FormGroup>
                <FormGroup className="auth-password" controlId="formBasicText">
                  <ControlLabel> Enter your password: </ControlLabel>
                  <FormControl
                    type="password"
                    value={this.state.password_value}
                    onChange={this.handlePasswordChange}
                    placeholder="Your password"
                  />
                  <FormControl.Feedback />
                </FormGroup>
              </Form>
              <ButtonToolbar className="auth-buttons">
                <Button
                  onClick={this.registerCallback}
                  bsSize="large"
                  bsStyle="primary"
                >
                  Register
                </Button>
                <Button
                  onClick={this.authCallback}
                  type="submit"
                  bsSize="large"
                  bsStyle="success"
                >
                  Log in
                </Button>
              </ButtonToolbar>
            </Col>
          </Row>
        </Col>
        <div className="footer">
          <p>
            {" "}
            Created with <span id="heart">❤</span> by{" "}
            <a
              href="https://vk.com/rmk1337"
              rel="noopener noreferrer"
              target="_blank"
            >
              {" "}
              Kirill Pavidlov{" "}
            </a>
          </p>
        </div>
      </div>
    ) : (
      <Redirect
        to={{
          pathname: "/add-info",
          state: { email: this.state.email_value }
        }}
      />
    );
  }

  validateEmail = email => {
    // eslint-disable-next-line
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(this.state.email_value);
  };
}

export default App;

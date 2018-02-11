import React, { Component } from "react";
import {
  Card,
  Col,
  Button,
  Input,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Label
} from "reactstrap";
import { Redirect } from "react-router-dom";
import * as INFO_CONSTANTS from "../Backend_answers/InfoConstants";
import "./AddInfo.css";

class AddInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      full_name: "",
      modal_shown: false,
      modal_title: "",
      modal_text: "",
      buttonContent: "",
      infoAdded: false,
      email: this.props.location.state.email
    };

    fetch(`api/get-info?email=${this.state.email}`, {
      accept: "application/json",
      credentials: "include"
    })
      .then(response => response.json())
      .then(json => {
        console.log("[DEBUG] In AddInfo, info is already added.");
        if (json.success === INFO_CONSTANTS.INFO_ADDED) {
          this.setState({ infoAdded: true });
        }
      });

    document.onkeypress = e => {
      if (e.keyCode === 13 && this.state.modal_shown) {
        this.setState({ modal_shown: !this.state.modal_shown });
      } else if (e.keyCode === 13) {
        this.submitAdditionalInfo();
      }
    };
  }

  handleFirstNameChange = e => {
    this.setState({ full_name: e.target.value });
  };

  closeModal = e => {
    this.setState({ modal_shown: false });
  };

  submitAdditionalInfo = e => {
    if (this.state.full_name === "") {
      this.setState({
        modal_shown: true,
        modal_title: "Name is not defined.",
        modal_text: "Add your full name to submit additional info."
      });
    } else {
      let name = this.state.full_name;
      let grade = document.getElementsByClassName(
        "info__grade__select__grade"
      )[0][
        document.getElementsByClassName("info__grade__select__grade")[0]
          .selectedIndex
      ].innerText;
      let letter = document.getElementsByClassName(
        "info__grade__select__letter"
      )[0][
        document.getElementsByClassName("info__grade__select__letter")[0]
          .selectedIndex
      ].innerText;

      fetch(`api/add-info?name=${name}&grade=${grade}&letter=${letter}`, {
        accept: "application/json",
        credentials: "include"
      })
        .then(response => response.json())
        .then(json => {
          console.log(json);
          this.setState({ infoAdded: true });
        });
    }
  };

  render() {
    return this.state.infoAdded ? (
      <Redirect from="/add-info" to="/assignments" />
    ) : (
      <Col xs={{ size: 4, offset: 4 }} className="info__container">
        <div className="modal-container">
          <Modal
            show={this.state.modal_shown}
            onHide={this.closeModal}
            container={this}
            aria-labelledby="contained-modal-title"
          >
            <ModalHeader closeButton>{this.state.modal_title}</ModalHeader>
            <ModalBody>{this.state.modal_text}</ModalBody>
            <ModalFooter>
              <Button onClick={this.closeModal}>Close</Button>
            </ModalFooter>
          </Modal>
        </div>
        <Card header="Additional information">
          <FormGroup>
            <Label for="add-info__input-fullname">Enter your full name:</Label>
            <Input
              className="add-info__fullname"
              type="email"
              value={this.state.full_name}
              onChange={this.handleFirstNameChange}
              placeholder="Your full name"
              id="add-info__input-fullname"
            />
            {/* <FormControl.Feedback /> */}
          </FormGroup>
          <FormGroup>
            <Label for="add-info__input-grade" className="info__grade__label">
              Select Grade:
            </Label>
            <Input
              type="select"
              id="add-info__input-grade"
              className="info__grade__select__grade"
              placeholder="select"
            >
              <option>9</option>
              <option>10</option>
              <option>11</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label
              for="add-info__input-grade_letter"
              className="info__grade__letter"
            >
              Select Grade Letter:
            </Label>
            <Input
              type="select"
              id="add-info__input-grade_letter"
              className="info__grade__select__letter"
              placeholder="select"
            >
              <option>А</option>
              <option>Б</option>
              <option>В</option>
              <option>Г</option>
              <option>Д</option>
            </Input>
          </FormGroup>
          <Button onClick={this.submitAdditionalInfo}>Submit</Button>
        </Card>
      </Col>
    );
  }
}

export default AddInfo;
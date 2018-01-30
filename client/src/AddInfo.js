import React, { Component } from "react";
import {
    Panel,
    Col,
    Button,
    FormControl,
    FormGroup,
    Modal,
    ControlLabel
} from "react-bootstrap";
import { Redirect } from "react-router-dom";
import * as INFO_CONSTANTS from "./Backend_answers/InfoConstants";
import "./AddInfo.css";

class AddInfo extends Component {
    constructor(props) {
        super(props);
        // TODO: add a loading bar when waiting for redirect if additional info already added.
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
                if (json.success === INFO_CONSTANTS.INFO_ADDED) {
                    this.setState({ infoAdded: true });
                }
            });

        document.onkeypress = e => {
            if (e.keyCode === 13 && this.state.modal_shown) {
                //Enter Keycode
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
            this.setState({ modal_shown: true });
            this.setState({ modal_title: "Name is not defined." });
            this.setState({
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
                document.getElementsByClassName(
                    "info__grade__select__letter"
                )[0].selectedIndex
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
    //TODO: improve texts

    render() {
        return this.state.infoAdded ? (
            <Redirect from="/add-info" to="/assignments" />
        ) : (
            <Col xs={4} xsOffset={4} className="info__container">
                <div className="modal-container">
                    <Modal
                        show={this.state.modal_shown}
                        onHide={this.closeModal}
                        container={this}
                        aria-labelledby="contained-modal-title">
                        <Modal.Header closeButton>
                            <Modal.Title id="contained-modal-title">
                                {this.state.modal_title}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>{this.state.modal_text}</Modal.Body>
                        <Modal.Footer>
                            <Button onClick={this.closeModal}>Close</Button>
                        </Modal.Footer>
                    </Modal>
                </div>
                <Panel header="Additional information">
                    <FormGroup controlId="formBasicText">
                        <ControlLabel>Enter your full name:</ControlLabel>
                        <FormControl
                            className="add-info__fullname"
                            type="email"
                            value={this.state.full_name}
                            onChange={this.handleFirstNameChange}
                            placeholder="Your full name"
                        />
                        <FormControl.Feedback />
                    </FormGroup>
                    <FormGroup controlId="formGradeSelect">
                        <ControlLabel className="info__grade__label">
                            Select Grade:
                        </ControlLabel>
                        <FormControl
                            className="info__grade__select__grade"
                            componentClass="select"
                            placeholder="select">
                            <option value="select">9</option>
                            <option value="select">10</option>
                            <option value="select">11</option>
                        </FormControl>
                    </FormGroup>
                    <FormGroup controlId="formControlsSelect">
                        <ControlLabel className="info__grade__letter">
                            Select Grade Letter:
                        </ControlLabel>
                        <FormControl
                            className="info__grade__select__letter"
                            componentClass="select"
                            placeholder="select">
                            <option value="select">А</option>
                            <option value="select">Б</option>
                            <option value="select">В</option>
                            <option value="select">Г</option>
                            <option value="select">Д</option>
                        </FormControl>
                    </FormGroup>
                    <Button
                        onClick={this.submitAdditionalInfo}
                        bsSize="large"
                        bsStyle="primary">
                        Submit
                    </Button>
                </Panel>
            </Col>
        );
    }
}

export default AddInfo;

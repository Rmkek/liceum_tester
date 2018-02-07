import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  Col,
  Row,
  Table,
  Button,
  FormGroup,
  FormControl,
  ControlLabel,
  Label
} from "react-bootstrap";
import * as ASSIGNMENT_CONSTANTS from "./Backend_answers/AssignmentConstants";
import * as CODE_TESTING_CONSTANTS from "./Backend_answers/CodeTestingConstants";
import "./Assignment.css";

class Assignment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assignments: null,
      assignment_pack_name: this.props.location.pathname.substring(
        this.props.location.pathname.lastIndexOf("/") + 1,
        this.props.location.pathname.length
      ),
      tests_status: []
    };

    fetch(
      `http://localhost:3000/api/getAssignmentPack?name=${
        this.state.assignment_pack_name
      }`,
      {
        accept: "application/json",
        credentials: "include"
      }
    )
      .then(response => response.json())
      .then(json => {
        if (
          json.error &&
          json.error === ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT
        ) {
          console.log("no such assignment");
          //TODO add proper error showcase
        }

        if (json) {
          this.setState({ assignments: json.assignments });
        }
        // GET_ASSIGNMENT_CONSTS.NO_SUCH_ASSIGNMENT
      });
  }

  onSendClick = e => {
    e.persist();
    let file = document
      .getElementById(`uploadForm-${e.target.getAttribute("id")}`)
      .getElementsByClassName("upload__file")[0].files[0];
    let formData = new FormData();
    let testsStatusDOMElement = document.getElementById(
      `tests_status-${e.target.getAttribute("id")}`
    );
    let testingLabel = <Label bsStyle="primary">Testing...</Label>;
    ReactDOM.render(testingLabel, testsStatusDOMElement);
    if (file === undefined) {
      return;
    }

    formData.append("codeFile", file);
    fetch(
      `http://localhost:3001/api/upload-code?assignmentPack=${
        this.state.assignment_pack_name
      }&assignment=${e.target.getAttribute("id")}`,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    )
      .then(resp => resp.json())
      .then(json => {
        switch (json) {
          case CODE_TESTING_CONSTANTS.TESTS_PASSED:
            let successLabel = <Label bsStyle="success">Success</Label>;
            ReactDOM.render(successLabel, testsStatusDOMElement);
            break;
          case CODE_TESTING_CONSTANTS.TESTS_FAILED:
            let warningLabel = <Label bsStyle="warning">Tests failed</Label>;
            ReactDOM.render(warningLabel, testsStatusDOMElement);
            break;
          case CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED:
            let uploadWarningLabel = (
              <Label bsStyle="warning">No files were uploaded.</Label>
            );
            ReactDOM.render(uploadWarningLabel, testsStatusDOMElement);
            break;
          default:
            let errorLabel = <Label bsStyle="danger">SERVER ERROR</Label>; // todo: add styling
            ReactDOM.render(errorLabel, testsStatusDOMElement);
            console.log("Default case happened (this is bad probably)");
        }
      });
  };

  render() {
    return this.state.assignments != null ? (
      <Col xs={6}>
        <Row>
          <Table bordered striped hover condensed>
            <thead className="table_color_fix">
              <tr>
                <th>Assignment</th>
                <th>Send solution</th>
                <th>Tests</th>
              </tr>
            </thead>

            <tbody className="table_color_fix">
              {this.state.assignments.map(element => (
                <tr key={element.name}>
                  <td>{element.name}</td>
                  <td>
                    <form
                      id={`uploadForm-${element.name}`}
                      action="http://localhost:3001/api/upload-code"
                      method="POST"
                      encType="multipart/form-data"
                    >
                      <FormGroup controlId="formControlsFile">
                        <ControlLabel>Source code</ControlLabel>
                        <FormControl
                          className="upload__file"
                          type="file"
                          name="sampleFile"
                        />
                        <Button
                          bsStyle="primary"
                          className="button--send"
                          id={element.name}
                          onClick={this.onSendClick}
                        >
                          Submit!
                        </Button>
                      </FormGroup>
                    </form>
                  </td>
                  <td id={`tests_status-${element.name}`}>Not stated.</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Row>
      </Col>
    ) : (
      ""
    );
  }
}

export default Assignment;

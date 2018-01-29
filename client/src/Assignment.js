import React, { Component } from "react";
import {
  Col,
  Row,
  Table,
  Button,
  FormGroup,
  FormControl,
  ControlLabel
} from "react-bootstrap";
import * as ASSIGNMENT_CONSTANTS from "./Backend_answers/AssignmentConstants";
import "./Assignment.css";

class Assignment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assignments: null
    };

    let assignment_pack_name = this.props.location.pathname.substring(
      this.props.location.pathname.lastIndexOf("/") + 1,
      this.props.location.pathname.length
    );

    fetch(
      `http://localhost:3000/api/getAssignmentPack?name=${assignment_pack_name}`,
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
          this.setState({ assignments: json.tasks });
        }
        // GET_ASSIGNMENT_CONSTS.NO_SUCH_ASSIGNMENT
      });
  }

  onSendClick = e => {
    let file = document
      .getElementById(`uploadForm-${e.target.getAttribute("id")}`)
      .getElementsByClassName("upload__file")[0].files[0];
    let formData = new FormData();
    console.log(file);

    if (file === undefined) {
      return;
    }

    formData.append("sampleFile", file);
    console.log(formData);
    fetch("http://localhost:3001/api/upload-code", {
      method: "POST",
      body: formData
    }).then(resp => console.log(resp));
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
                  <td>Not stated.</td>
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

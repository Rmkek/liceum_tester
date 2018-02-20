import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Col, Row, Table, Button, FormGroup, Badge, Input, Label, Alert } from "reactstrap";
import * as ASSIGNMENT_CONSTANTS from "../../Backend_answers/AssignmentConstants";
import * as CODE_TESTING_CONSTANTS from "../../Backend_answers/CodeTestingConstants";
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
      tests_status: [],
      assignment_not_found: "",
      assignment_badge: "Not solved."
    };

    fetch(`http://localhost:3000/api/getAssignmentPack?name=${this.state.assignment_pack_name}`, {
      accept: "application/json",
      credentials: "include"
    })
      .then(response => response.json())
      .then(json => {
        if (json.error && json.error === ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT) {
          let errorRender = (
            <Alert color="danger">
              <h4>There is no such assignment!</h4>
              <p>
                Try going back to where you came from and rechecking your URL. If this doesn't help - contact site{" "}
                <a href="https://vk.com/rmk1337" rel="noopener noreferrer" target="_blank">
                  admin
                </a>
              </p>
            </Alert>
          );
          this.setState({
            assignment_not_found: errorRender
          });
        }

        if (json) {
          this.setState({ assignments: json.assignments });
        }
      });
  }

  onSendClick = e => {
    e.persist();
    let file = document.getElementById(`uploadForm-${e.target.getAttribute("id")}`).getElementsByClassName("upload__file")[0].files[0];
    let formData = new FormData();
    let testsStatusDOMElement = document.getElementById(`tests_status-${e.target.getAttribute("id")}`);
    let testingBadge = <Badge color="secondary">Testing...</Badge>;

    ReactDOM.render(testingBadge, testsStatusDOMElement);
    if (file === undefined) {
      return;
    }

    formData.append("codeFile", file);

    fetch(
      `http://localhost:3001/api/upload-code?assignmentPack=${this.state.assignment_pack_name}&assignment=${e.target.getAttribute("id")}`,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    )
      .then(resp => resp.json())
      .then(json => {
        if (json.error) {
          let warningBadge = <Badge color="warning">Tests failed on test {json.on_test}</Badge>;
          ReactDOM.render(warningBadge, testsStatusDOMElement);
          return;
        } else {
          switch (json) {
            case CODE_TESTING_CONSTANTS.TESTS_PASSED:
              let successBadge = <Badge color="success">Success</Badge>;
              ReactDOM.render(successBadge, testsStatusDOMElement);
              break;
            case CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED:
              let uploadWarningBadge = <Badge color="warning">No files were uploaded.</Badge>;
              ReactDOM.render(uploadWarningBadge, testsStatusDOMElement);
              break;
            default:
              let errorBadge = <Badge color="danger">SERVER ERROR</Badge>;
              ReactDOM.render(errorBadge, testsStatusDOMElement);
              console.log("Default case happened (this is bad probably)");
          }
        }
      });
  };

  render() {
    return this.state.assignments != null ? (
      <Col lg={{ size: 6, offset: 3 }} md={{ size: 6, offset: 3 }} xs={{ size: 6, offset: 3 }}>
        <Row>
          <Table bordered hover>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Send solution</th>
                <th>Tests</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {this.state.assignments.map(element => (
                <tr key={element.name}>
                  <th scope="row">{element.name}</th>
                  <td>
                    <form
                      id={`uploadForm-${element.name}`}
                      action="http://localhost:3001/api/upload-code"
                      method="POST"
                      encType="multipart/form-data">
                      <FormGroup>
                        <Label for="upload__file-input">Source code</Label>
                        {element.solved ? "" : <Input id="upload__file-input" className="upload__file" type="file" name="sampleFile" />}
                        {element.solved ? (
                          ""
                        ) : (
                          <Button className="button--send" id={element.name} onClick={this.onSendClick}>
                            Submit
                          </Button>
                        )}
                      </FormGroup>
                    </form>
                  </td>
                  <td id={`tests_status-${element.name}`}>
                    {element.solved === true ? <Badge color="success">Solved</Badge> : this.state.assignment_badge}
                  </td>
                  <td>
                    {this.state.assignment_pack_name === "Easy Tasks" ? (
                      <a href="http://localhost:3001/task1.pdf" target="_blank" rel="noopener noreferrer">
                        Click me!
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Row>
      </Col>
    ) : (
      this.state.assignment_not_found
    );
  }
}

export default Assignment;

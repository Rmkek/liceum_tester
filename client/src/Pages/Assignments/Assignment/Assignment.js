import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Col, Row, Table, Button, FormGroup, Badge, Input, Label, Alert } from "reactstrap";
import * as ASSIGNMENT_CONSTANTS from "../../../Backend_answers/AssignmentConstants";
import * as CODE_TESTING_CONSTANTS from "../../../Backend_answers/CodeTestingConstants";
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
      assignment_badge: "Not solved.",
      pdfPath: ""
    };

    fetch("/api/getAssignmentPack", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ assignmentPack: this.state.assignment_pack_name })
    })
      .then(response => response.json())
      .then(json => {
        console.log("got json: ", json);
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
          // path depends on local and heroku server.
          this.setState({
            assignments: json.tasks,
            pdfPath: json.pdfPath
          });
        }
      });
  }

  onSendClick = e => {
    e.persist();
    let file = document.getElementById(`uploadForm-${e.target.getAttribute("id")}`).getElementsByClassName("upload__file")[0].files[0];
    let data = new FormData();
    let testsStatusDOMElement = document.getElementById(`tests_status-${e.target.getAttribute("id")}`);
    let testingBadge = <Badge color="secondary">Testing...</Badge>;

    ReactDOM.render(testingBadge, testsStatusDOMElement);
    if (file === undefined) {
      return;
    }
    console.log(file);
    data.append("codeFile", file);
    data.append("assignmentPackName", this.state.assignment_pack_name);
    data.append("assignmentID", e.target.getAttribute("id"));
    fetch(`/api/upload-code`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      credentials: "include",
      body: data
    })
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
                    <form id={`uploadForm-${element.id}`} action="/api/upload-code" method="POST" encType="multipart/form-data">
                      <FormGroup>
                        <Label for="upload__file-input">Source code</Label>
                        {element.solved ? "" : <Input id="upload__file-input" className="upload__file" type="file" name="sampleFile" />}
                        {element.solved ? (
                          ""
                        ) : (
                          <Button className="button--send" id={element.id} onClick={this.onSendClick}>
                            Submit
                          </Button>
                        )}
                      </FormGroup>
                    </form>
                  </td>
                  <td id={`tests_status-${element.id}`}>
                    {element.solved === true ? <Badge color="success">Solved</Badge> : this.state.assignment_badge}
                  </td>
                  <td>
                    <a href={this.state.pdfPath} target="_blank" rel="noopener noreferrer">
                      Click me!
                    </a>
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

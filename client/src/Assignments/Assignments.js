import React, { Component } from "react";
import { Card, Col, Row, CardTitle, Alert, CardText } from "reactstrap";
import "./Assignments.css";
import { Link } from "react-router-dom";

class Assignments extends Component {
  constructor() {
    super();

    this.state = {
      assignments: "",
      keyIter: -1,
      assignments_json: {},
      full_name: ""
    };
  }

  componentDidMount = () => {
    fetch(`api/assignments`, {
      accept: "application/json",
      credentials: "include"
    })
      .then(response => response.json())
      .then(json => {
        let assignmentArray = [];
        json.assignments.forEach(element => {
          assignmentArray.push(this.renderAssignment(element));
        });
        this.setState({
          assignments_json: json,
          assignments: assignmentArray,
          full_name: this.props.location.state.full_name
        });
      });
  };

  renderAssignment = elem => {
    this.setState({ keyIter: ++this.state.keyIter });
    return (
      <Col key={this.state.keyIter} lg={2} md={2} xs={2}>
        <Link style={{ textDecoration: "none", color: "black" }} to={`/assignment/${encodeURI(elem.name)}`}>
          <Card className="assignment__thumbnail">
            <CardTitle className="assignment__thumbnail-title">{elem.name}</CardTitle>
            <CardText>{elem.category}</CardText>
          </Card>
        </Link>
      </Col>
    );
  };

  render() {
    return (
      <Col xs={{ size: 4, offset: 2 }} md={{ size: 6, offset: 3 }}>
        <Alert color="dark">
          <Row>
            <h1 className="alert-heading alert__h1">Your assignments</h1>
            <small>Logged in as {this.state.full_name}</small>
          </Row>
          <Row>{this.state.assignments}</Row>
        </Alert>
      </Col>
    );
  }
}

export default Assignments;

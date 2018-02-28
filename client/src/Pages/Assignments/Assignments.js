import React, { Component } from "react";
import { Col, Container, Card, CardTitle, CardText, CardGroup, CardBody } from "reactstrap";
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
        json.forEach(element => {
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
      <Link key={this.state.keyIter} className="assignment__link" to={`/assignment/${encodeURI(elem.name)}`}>
        <Card className="assignment__thumbnail">
          <CardBody>
            <CardTitle className="assignment__thumbnail-title">{elem.name}</CardTitle>
            <CardText>{elem.category}</CardText>
          </CardBody>
        </Card>
      </Link>
    );
  };

  render() {
    return (
      <div>
        <Col xs={{ size: 4, offset: 2 }} md={{ size: 6, offset: 3 }}>
          <Container className="assignment-container bg-aqua">
            <h1 className="alert-heading alert__h1">Your assignments</h1>
            <small className="alert-heading logged_in">Logged in as {this.state.full_name}</small>
            <CardGroup className="border--blue assignment-link">{this.state.assignments}</CardGroup>
          </Container>
        </Col>
      </div>
    );
  }
}

export default Assignments;

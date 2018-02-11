import React, { Component } from "react";
import { Card, Col, Row, CardTitle, CardSubtitle } from "reactstrap";
import "./Assignments.css";
import { Link } from "react-router-dom";

class Assignments extends Component {
  constructor() {
    super();

    this.state = {
      assignments: "",
      keyIter: -1,
      assignments_json: {}
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
          assignments: assignmentArray
        });
      })
      .catch(err => {
        console.log("finally a fucking error happened", err);
      });
  };

  renderAssignment = elem => {
    this.setState({ keyIter: ++this.state.keyIter });
    return (
      <Col key={this.state.keyIter} lg={2} md={2} xs={2}>
        <Link style={{ textDecoration: "none", color: "black" }} to={`/assignment/${encodeURI(elem.name)}`}>
          <Card className="assignment__thumbnail">
            <CardTitle className="assignment__thumbnail-title">{elem.name}</CardTitle>
            <CardSubtitle>{elem.category}</CardSubtitle>
          </Card>
        </Link>
      </Col>
    );
  };

  render() {
    return (
      <Col xs={12} md={12}>
        <Row>{this.state.assignments}</Row>
      </Col>
    );
  }
}

export default Assignments;

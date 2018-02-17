import React, { Component } from "react";
import { Container, Col, Form, FormGroup, Label, Input, Button, Card, CardTitle, CardBody } from "reactstrap";

class AddAssignments extends Component {
  sendHandler(e) {
    console.log("Button has been pressed.");
    console.log(e);
  }

  render() {
    return (
      <Container>
        <Card>
          <CardBody>
            <CardTitle>Add assignment pack</CardTitle>
            <Form>
              <FormGroup row>
                <Label for="assignmentPackName" sm={2}>
                  Pack name
                </Label>
                <Col sm={10}>
                  {/*  email because textField takes 2-3 lines which is obesity */}
                  <Input type="email" name="assignmentPackName" id="assignmentPackName" placeholder="Example: multidimensional arrays" />
                </Col>
              </FormGroup>
              <FormGroup row>
                {/* TODO: Add category picking from list */}
                <Label for="assignmentPackCategories" sm={2}>
                  Pack categories
                </Label>
                <Col sm={10}>
                  <Input type="email" name="assignmentPackCategories" id="assignmentPackCategories" placeholder="Example: hard, 10A, 9B" />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label for="pdfTasks" sm={2}>
                  PDF-tasks
                </Label>
                <Col sm={10}>
                  <Input type="file" name="pdfTasks" id="pdfTasks" />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label for="tests" sm={2}>
                  Tests
                </Label>
                <Col sm={10}>
                  <Input type="file" name="tests" id="tests" />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Col sm={{ size: 10, offset: 2 }}>
                  <Button onClick={this.sendHandler}>Submit</Button>
                </Col>
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </Container>
    );
  }
}

export default AddAssignments;

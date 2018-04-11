import React, { Component } from 'react'
import { Container, Col, Form, FormGroup, Label, Input, Button, Card, CardTitle, CardBody, Row } from 'reactstrap'
import './AddAssignments.css'
import Spinner from '../../../Reusables/Spinner/Spinner'
import { Redirect } from 'react-router-dom'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

class AddAssignments extends Component {
  constructor () {
    super()
    this.state = {
      assignmentsAmount: 1,
      testsAmount: 1,
      assignments: [
        [
          <Col sm={3} className='test__container test_margin' key={`1_1`}>
            <Label for='test_input_1-1'>Input</Label>
            <Col>
              <Input type='textarea' name='test_input_1-1' />
            </Col>
            <Label for='test_output_1-1'>Output</Label>
            <Col>
              <Input type='textarea' name='test_output_1-1' />
            </Col>
            <Col>
              <Button className='add-test__button' onClick={e => this.renderTest(e)}>
                Add test
              </Button>
            </Col>
          </Col>
        ]
      ],
      renderAssignments: (
        <Col sm={12} className='assignment_margin'>
          <FormGroup row>
            <Label for='assignmentNames' sm={{ size: 2, offset: 1 }}>
              Assignment Name
            </Label>
            <Col sm={8}>
              <Input name='assignmentNames' placeholder='Example: Task' />
            </Col>
          </FormGroup>
          <Col sm={3} className='test__container test_margin'>
            <Label for='test_input_1-1'>Input</Label>
            <Col>
              <Input type='textarea' name='test_input_1-1' />
            </Col>
            <Label for='test_output_1-1'>Output</Label>
            <Col>
              <Input type='textarea' name='test_output_1-1' />
            </Col>
            <Col>
              <Button className='add-test__button' onClick={e => this.renderTest(e)}>
                Add test
              </Button>
            </Col>
          </Col>
        </Col>
      ),
      value: undefined,
      options: [],
      loading: false,
      redirect: false,
      redirect_url: ''
    }

    window.fetch('/api/get-teacher-categories', {
      credentials: 'include',
      method: 'POST'
    })
      .then(res => res.json())
      .then(json => {
        if (json.categories.length === 0) {
          this.setState({options: []})
        } else {
          this.setState({options: json.categories})
        }
        console.log('this.state: ', this.state)
      })
      .catch(err => {
        console.log('err when requesting /api/get-teacher-categories: ', err)
      })
  }

  sendHandler = (e) => {
    e.preventDefault()
    const data = new window.FormData(document.getElementById('mainForm'))
    data.append('file', document.getElementById('pdfTasks'))
    data.append('category', this.state.value.value)

    for (let pair of data.entries()) {
      if (pair[1] === null || pair[1] === '' || pair[1] === undefined || (this.state.value === undefined && this.state.options.length === 0)) {
        window.alert('One of form fields is not present. Fill it, before continuing.')
      }
    }

    this.setState({loading: true})

    window.fetch(`/api/add-assignment`, {
      accept: 'application/json',
      credentials: 'include',
      method: 'POST',
      body: data
    })
      .then(response => response.json())
      .then(resp => {
        console.log(resp)
        this.setState({loading: false, redirect: true, redirect_url: '/teacher/categories'})
      })
  }

  renderTest = (e) => {
    // this if gets called if we have more than one assignment
    if (e.target.className !== e.target.attributes[1].value) {
      let currentAssignment = e.target.attributes[1].value - 1
      let newState = this.state.assignments[currentAssignment]

      newState.push(
        <Col
          sm={3}
          className='test__container test_margin'
          key={`${this.state.assignments.length}_${this.state.assignments[currentAssignment].length + 1}`}>
          <Label for={`test_input_${this.state.assignments.length}-${this.state.assignments[currentAssignment].length + 1}`}>Input</Label>
          <Col>
            <Input
              type='textarea'
              name={`test_input_${this.state.assignments.length}-${this.state.assignments[currentAssignment].length + 1}`}
            />
          </Col>
          <Label for={`test_output_${this.state.assignments.length}-${this.state.assignments[currentAssignment].length + 1}`}>Output</Label>
          <Col>
            <Input
              type='textarea'
              name={`test_output_${this.state.assignments.length}-${this.state.assignments[currentAssignment].length + 1}`}
            />
          </Col>
        </Col>
      )

      let oldState = this.state.assignments
      oldState[currentAssignment] = newState
      this.setState({ testsAmount: this.state.testsAmount + 1, assignments: oldState, renderAssignments: this.wrapInRow(oldState) })
    } else {
      // here comes the bug when you add new test it removes previous text. fixme
      let newState = this.state.assignments[0]
      let oldState = this.state.assignments

      newState.push(
        <Col sm={3} className='test__container test_margin' key={`${this.state.assignments.length}_${this.state.testsAmount + 1}`}>
          <Label for={`test_input_${this.state.assignments.length}-${this.state.testsAmount + 1}`}>Input</Label>
          <Col>
            <Input type='textarea' name={`test_input_${this.state.assignments.length}-${this.state.testsAmount + 1}`} />
          </Col>
          <Label for={`test_output_${this.state.assignments.length}-${this.state.testsAmount + 1}`}>Output</Label>
          <Col>
            <Input type='textarea' name={`test_output_${this.state.assignments.length}-${this.state.testsAmount + 1}`} />
          </Col>
        </Col>
      )

      oldState[0] = newState
      this.setState({ testsAmount: this.state.testsAmount + 1, assignments: oldState, renderAssignments: this.wrapInRow(oldState) })
    }
  }

  wrapInRow = (state) => {
    let output = []
    state.forEach(assignment => {
      output.push(
        <div key={`row_${assignment[0].key}`}>
          <FormGroup row className='assignment_margin'>
            <Label for='assignmentNames' sm={{ size: 2, offset: 1 }}>
              Assignment Name
            </Label>
            <Col sm={8}>
              <Input name='assignmentNames' id={`assignmentName_${this.state.assignmentsAmount + 1}`} placeholder='Example: Task' />
            </Col>
          </FormGroup>
          <Row>{assignment}</Row>
        </div>
      )
    })
    return <Col sm={12}>{output}</Col>
  }

  renderAssignment = () => {
    let newState = this.state.assignments
    console.log('renderAssignment state: ', newState)
    newState.push([
      <Col sm={3} className='test__container test_margin' key={`${this.state.assignments.length + 1}_1`}>
        <Label for={`test_input_${this.state.assignments.length + 1}-1`}>Input</Label>
        <Col>
          <Input type='textarea' name={`test_input_${this.state.assignments.length + 1}-1`} />
        </Col>
        <Label for={`test_output_${this.state.assignments.length + 1}-1`}>Output</Label>
        <Col>
          <Input type='textarea' name={`test_output_${this.state.assignments.length + 1}-1`} />
        </Col>
        <Col>
          <Button className='add-test__button' assignment={this.state.assignmentsAmount + 1} onClick={e => this.renderTest(e)}>
            Add test
          </Button>
        </Col>
      </Col>
    ])

    const renderedAssignments = this.wrapInRow(newState)

    this.setState({
      assignmentsAmount: this.state.assignmentsAmount + 1,
      testsAmount: this.state.testsAmount + 1,
      assignments: newState,
      renderAssignments: renderedAssignments
    })
  }

  handleChange = (value) => {
    console.log('value: ', value)
    this.setState({value: value})
    console.log('state after changing: ', this.state)
  }

  render () {
    if (this.state.redirect) {
      return (
        <Redirect
          to={{
            pathname: this.state.redirect_url
          }}
        />
      )
    }

    return (this.state.loading ? <Spinner />
      : <Container>
        <Card className='pack__container'>
          <CardBody>
            <CardTitle>Add assignment pack</CardTitle>
            <Form id='mainForm' onSubmit={this.sendHandler}>
              <FormGroup row>
                <Label for='assignmentPackName' sm={2}>
                  Pack name
                </Label>
                <Col sm={10}>
                  <Input noValidate name='assignmentPackName' id='assignmentPackName' placeholder='Example: multidimensional arrays' />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label for='assignmentPackCategory' sm={2}>
                  Pack category
                </Label>
                <Col sm={10}>
                  <Select.Creatable
                    name='form-field-name'
                    placeholder='Select or create new one'
                    value={this.state.value}
                    onChange={this.handleChange}
                    options={this.state.options}
                  />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label for='pdfTasks' sm={2}>
                  PDF-tasks
                </Label>
                <Col sm={10}>
                  <Input type='file' name='pdfTasks' id='pdfTasks' />
                </Col>
              </FormGroup>
              <FormGroup>
                <Card sm={10} className='pack__container'>
                  <Row >{this.state.renderAssignments}</Row>
                  <CardBody />
                  <Button onClick={() => this.renderAssignment()}> Add more assignments</Button>
                </Card>
              </FormGroup>
              <FormGroup row>
                <Col sm={{ size: 10, offset: 2 }}>
                  <Button>Submit!</Button>
                </Col>
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </Container>
    )
  }
}

export default AddAssignments

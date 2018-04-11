import React, { Component } from 'react'
import { Col, Card, CardTitle, CardBody, FormGroup, Button, Row, Input, Label, Form } from 'reactstrap'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import './AssignmentsChanger.css'
import Spinner from '../Spinner/Spinner'

class AssignmentChanger extends Component {
  constructor (props) {
    super(props)
    console.log('Props in AssignmentChanger: ', props)
    this.state = {
      assignmentsAmount: 1,
      testsAmount: 1,
      value: props.pack_category_value,
      options: props.options,
      is_loading: false,
      pack_name: props.name
    }
    console.log('state after creation: ', this.state)
  }

  sendHandler = (e) => {
    e.preventDefault()

    this.setState({is_loading: true})
    const data = new window.FormData(document.getElementById('mainForm'))
    data.append('file', document.getElementById('pdfTasks'))
    data.append('category', this.state.value ? this.state.value.value : this.props.categoryValue)
    data.append('assignmentName', this.props.name)

    window.fetch(`/api/teacher-update-assignment`, {
      accept: 'application/json',
      credentials: 'include',
      method: 'POST',
      body: data
    })
      .then(response => response.json())
      .then(resp => {
        console.log(resp)
        this.setState({is_loading: false})
      })
  }

  handleNameChange = (e) => {
    this.setState({pack_name: e.target.value})
  }

  selectHandler = (selectedValue) => {
    this.setState({value: selectedValue})
  }

  render () {
    console.log('got propsies: ', this.props)

    return this.state.is_loading ? <Spinner /> : (<Card className='pack__container'>
      <CardBody>
        <CardTitle>{this.props.name}</CardTitle>
        <Form id='mainForm' onSubmit={this.sendHandler}>
          <FormGroup row>
            <Label for='assignmentPackName' sm={2}>
        Pack name
            </Label>
            <Col sm={10} key={this.props.name + '_col'}>
              <Input noValidate name='assignmentPackName' id='assignmentPackName' defaultValue={this.props.name || ''} />
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label for='assignmentPackCategory' sm={2}>
        Pack category
            </Label>
            <Col sm={10}>
              <Select.Creatable
                name='form-field-name'
                placeholder='Change to existing one...'
                value={this.state.value}
                onChange={this.selectHandler}
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
              <p>Current pdf file: <a href={this.props.pdfPath} target='_blank'>click me!</a></p>
            </Col>
          </FormGroup>
          <FormGroup>
            <Card sm={10} className='pack__container'>
              <Row>
                {this.props.tasksArray ? this.props.tasksArray.map(each => {
                  return (
                    <Col key={each._id} sm={12} className='assignment_margin'>
                      <FormGroup row>
                        <Label for='assignmentNames' sm={{ size: 2, offset: 1 }}>
                                Assignment Name
                        </Label>
                        <Col sm={8}>
                          <Input name='assignmentNames' placeholder='Example: Task' defaultValue={each.name} />
                        </Col>
                      </FormGroup>
                      {each.tests.map(test => {
                        return (<Col key={test._id} sm={3} className='test__container test_margin'>
                          <Label for='test_input_1-1'>Input</Label>
                          <Col>
                            <Input type='textarea' name='test_input_1-1' defaultValue={test.input} />
                          </Col>
                          <Label for='test_output_1-1'>Output</Label>
                          <Col>
                            <Input type='textarea' name='test_output_1-1' defaultValue={test.output} />
                          </Col>
                          {/* <Col>
                          <Button className='add-test__button' onClick={e => this.renderTest(e)}>
                                  Add test
                          </Button>
                        </Col> */}
                        </Col>
                        )
                      })}
                    </Col>
                  )
                })
                  : ''}
              </Row>
              {/* <Row >{this.state.renderAssignments}</Row> */}
              <CardBody />
              {/* TODO: Add this functionaly later okay? */}
              {/* <Button onClick={() => this.renderAssignment()}> Add more assignments</Button> */}
            </Card>
          </FormGroup>
          <FormGroup row>
            <Col sm={{ size: 10, offset: 2 }}>
              <Button onClick={this.sendHandler}>Update tasks</Button>
            </Col>
          </FormGroup>
        </Form>
      </CardBody>
    </Card>)
  }
}

export default AssignmentChanger

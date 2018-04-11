import React, { Component } from 'react'
import { Col, Container, Card, CardTitle, CardGroup, CardBody, Collapse } from 'reactstrap'
import './Categories.css'
import { Redirect } from 'react-router-dom'
import Assignment from '../../Pages/User/Assignments/Assignment/Assignment'
import AssignmentsChanger from '../AssignmentsChanger/AssignmentsChanger'
import Spinner from '../Spinner/Spinner'

class Categories extends Component {
  constructor (props) {
    super(props)

    this.state = {
      categories: '',
      categoryIter: -1,
      options: '',
      assignmentIter: -1,
      full_name: '',
      redirect: false,
      redirect_url: '',
      categoryCollapse: false,
      assignments: '',
      assignmentCollapse: false,
      currentAssignment: '',
      pack_category_value: '',
      assignment_badge: 'Not solved.',
      file: undefined,
      is_loading: true,
      clicked_assignment: '',
      current_assignment: ''
    }
    console.log(this.props)
    if (this.props.isTeacher) {
      window.fetch(`/api/get-teacher-categories`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        method: 'POST'
      })
        .then(response => {
          console.log(response)
          if (response.redirected) {
            this.setState({
              redirect_url: response.url.substring(response.url.lastIndexOf('/'), response.url.length),
              redirect: true,
              is_loading: false
            })
          } else {
            response.json().then(answer => {
              console.log(answer)
              let categoryArray = []
              answer.categories.forEach(element => {
                categoryArray.push(this.renderCategory(element))
              })

              window.fetch('/api/get-info', {
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                credentials: 'include',
                method: 'POST'
              }).then(response => response.json())
                .then(json => {
                  this.setState({
                    categories: categoryArray,
                    full_name: json.name,
                    options: answer.categories,
                    is_loading: false
                  })
                  console.log('state after changing: ', this.state)
                })
            })
          }
        })
    } else {
      window.fetch(`/api/assignments`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        method: 'POST'
      })
        .then(response => {
          if (response.redirected) {
            this.setState({
              redirect_url: response.url.substring(response.url.lastIndexOf('/'), response.url.length),
              redirect: true,
              is_loading: false
            })
          } else {
            response.json().then(resp => {
              console.log('resp: ', resp)
              window.fetch('/api/get-info', {
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                credentials: 'include',
                method: 'POST'
              }).then(response => response.json())
                .then(json => {
                  console.log('got info: ', json)
                  let categoryArray = []
                  json.categories.forEach(element => {
                    categoryArray.push(this.renderCategory(element))
                  })
                  this.setState({
                    assignments_json: json,
                    categories: categoryArray,
                    full_name: json.name,
                    is_loading: false
                  })
                })
            })
          }
        })
    }
  }

  categoryCollapseHandler = (category) => {
    window.fetch('/api/assignments', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        category: category
      })
    }).then(response => response.json())
      .then(json => {
        let renderedAssignments = []
        json.forEach(assignment => {
          renderedAssignments.push(this.renderAssignment(assignment))
        })
        this.setState({
          categoryCollapse: !this.state.categoryCollapse,
          assignments: renderedAssignments,
          pack_category_value: category})

        console.log('got assignments: ', json)
      })
  }

  selectHandler = (value) => {
    this.setState({pack_category_value: value})
  }
  handleFileChange = (e) => {
    this.setState({file: e[0]})
  }

  assignmentCollapseHandler = (assignment) => {
    console.log('got: ', assignment)
    this.setState({current_assignment: assignment,
      assignmentCollapse: !this.state.assignmentCollapse})
    // if (!this.state.categoryCollapse) {
    //   this.setState({assignmentCollapse: !this.state.assignmentCollapse})
    // } else if (this.props.isTeacher) {
    //   this.setState({
    //     assignmentCollapse: !this.state.assignmentCollapse,
    //     currentAssignment: <AssignmentsChanger name={assignment.name} categoryValue={this.state.pack_category_value} options={this.state.options} tasksArray={assignment.tasks} pdfPath={assignment.pdfPath} />})
    // } else {
    //   let renderedAssignment = <Assignment assignment={assignment} />
    //   this.setState({
    //     currentAssignment: renderedAssignment,
    //     assignmentCollapse: !this.state.assignmentCollapse
    //   })
    // }
  }

  renderAssignment = (assignment) => {
    // this.setState({ assignmentIter: ++this.state.assignmentIter })
    return (
      <Col xs={2} key={assignment.name} onClick={() => this.assignmentCollapseHandler(assignment)} className='category__container assignment__container'>
        <Card >
          <CardBody className='category__body'>
            <CardTitle className='assignment_no-hover'>{assignment.name}</CardTitle>
          </CardBody>
        </Card>
      </Col>
    )
  }

  renderCategory = (category) => {
    this.setState({ categoryIter: ++this.state.categoryIter })
    return (
      <Col xs={2} key={this.state.categoryIter} onClick={() => this.props.isTeacher ? this.categoryCollapseHandler(category.value) : this.categoryCollapseHandler(category)} className='category__container'>
        <Card >
          <CardBody className='category__body'>
            <CardTitle>{this.props.isTeacher ? category.value.toUpperCase() : category.toUpperCase()}</CardTitle>
          </CardBody>
        </Card>
      </Col>
    )
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
    return (
      this.state.is_loading ? <Spinner />
        : <Col xs={12}>
          {/* same code??? */}
          {this.props.isTeacher
            ? <Container className='assignment-container'>
              <h1 className='alert-heading alert__h1'>Your categories</h1>
              <small className='alert-heading logged_in'>Logged in as {this.state.full_name}</small>
              <CardGroup className='assignment-link'>{this.state.categories}</CardGroup>
              <Collapse isOpen={this.state.categoryCollapse}>
                <Card className='assignment__body'>
                  <CardBody className='pack__container'>
                    <CardTitle>Assignments</CardTitle>
                    {this.state.assignments}
                    <Collapse isOpen={this.state.assignmentCollapse}>
                      {/* {this.state.currentAssignment} */}
                      <AssignmentsChanger
                        name={this.state.current_assignment.name}
                        categoryValue={this.state.pack_category_value}
                        options={this.state.options}
                        tasksArray={this.state.current_assignment.tasks}
                        pdfPath={this.state.current_assignment.pdfPath} />
                    </Collapse>
                  </CardBody>
                </Card>
              </Collapse>
            </Container>
            : <Container className='assignment-container'>
              <h1 className='alert-heading alert__h1'>Your assignment categories</h1>
              <small className='alert-heading logged_in'>Logged in as {this.props.full_name}</small>
              <CardGroup className='assignment-link'>{this.state.categories}</CardGroup>
              <Collapse isOpen={this.state.categoryCollapse}>
                <Card className='assignment__body'>
                  <CardBody>
                    <CardTitle>Assignments</CardTitle>
                    {this.state.assignments}
                    <Collapse isOpen={this.state.assignmentCollapse}>
                      <Assignment assignment={this.state.current_assignment} />
                    </Collapse>
                  </CardBody>
                </Card>
              </Collapse>
            </Container>}

        </Col>
    )
  }
}

export default Categories

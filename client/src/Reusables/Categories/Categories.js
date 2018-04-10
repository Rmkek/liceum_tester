import React, { Component } from 'react'
import { Col, Container, Card, CardTitle, CardGroup, CardBody, Collapse } from 'reactstrap'
import './Categories.css'
import { Redirect } from 'react-router-dom'
import AssignmentsChanger from '../AssignmentsChanger/AssignmentsChanger'

class Categories extends Component {
  constructor () {
    super()

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
      pack_category_value: ''
    }
  }

  componentDidMount () {
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
            redirect: true
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
                  options: answer.categories
                })
                console.log('state after changing: ', this.state)
              })
          })
        }
      })
  };

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

  sendHandler = (e) => {
    console.log(e)
  }

  selectHandler = (value) => {
    this.setState({pack_category_value: value})
  }

  assignmentCollapseHandler = (assignment) => {
    console.log('got: ', assignment)
    console.log('state: ', this.state)
    let assignmentPack = <AssignmentsChanger name={assignment.name} categoryValue={this.state.pack_category_value} options={this.state.options} tasksArray={assignment.tasks} pdfPath={assignment.pdfPath} />
    this.setState({
      assignmentCollapse: !this.state.assignmentCollapse,
      currentAssignment: assignmentPack})
  }

  renderAssignment = (assignment) => {
    this.setState({ assignmentIter: ++this.state.assignmentIter })
    return (
      // <Col xs={2} key={this.state.keyIter} onClick={() => this.collapseHandler(category.value)} className='category__container'>
      <Col xs={2} key={this.state.assignmentIter} onClick={() => this.assignmentCollapseHandler(assignment)} className='category__container'>
        <Card >
          <CardBody className='category__body'>
            <CardTitle>{assignment.name}</CardTitle>
          </CardBody>
        </Card>
      </Col>
    )
  }

  renderCategory = (category) => {
    this.setState({ categoryIter: ++this.state.categoryIter })
    return (
      <Col xs={2} key={this.state.categoryIter} onClick={() => this.categoryCollapseHandler(category.value)} className='category__container'>
        <Card >
          <CardBody className='category__body'>
            <CardTitle>{category.value.toUpperCase()}</CardTitle>
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
      <Col xs={12}>
        <Container className='assignment-container'>
          <h1 className='alert-heading alert__h1'>Your categories</h1>
          <small className='alert-heading logged_in'>Logged in as {this.state.full_name}</small>
          <CardGroup className='assignment-link'>{this.state.categories}</CardGroup>
          <Collapse isOpen={this.state.categoryCollapse}>
            <Card className='assignment__body'>
              <CardBody>
                <CardTitle>Assignments</CardTitle>
                {this.state.assignments}
                <Collapse isOpen={this.state.assignmentCollapse}>
                  {this.state.currentAssignment}
                </Collapse>
              </CardBody>
            </Card>
          </Collapse>
        </Container>
      </Col>
    )
  }
}

export default Categories

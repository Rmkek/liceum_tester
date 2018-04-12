import React, { Component } from 'react'
import { Container, Card, CardBody, CardTitle, Button, Row, Col } from 'reactstrap'
import { Link } from 'react-router-dom'
import Spinner from '../../Reusables/Spinner/Spinner'
import './Teacher.css'

class Teacher extends Component {
  constructor (props) {
    super(props)

    this.state = {
      is_loading: true,
      unapprovedUsersAmount: 0,
      assignmentsAmount: 0,
      studentsAmount: 0
    }

    window.fetch('/api/get-profile-data', {
      credentials: 'include',
      method: 'POST'
    })
      .then(res => res.json())
      .then(json => {
        this.setState({ is_loading: false,
          unapprovedUsersAmount: json.unapprovedUsersAmount,
          assignmentsAmount: json.assignmentsAmount,
          studentsAmount: json.studentsAmount,
          full_name: json.full_name})
        console.log('this.state: ', this.state)
      })
      .catch(err => {
        console.log('err: ', err)
      })
  }

  render () {
    return this.state.is_loading ? <Spinner /> : (<Row><Col xs={{offset: 3, size: 6}}>
      <Container>
        <Card className='content-container'>
          <CardBody>
            <CardTitle>Logged as {this.state.full_name}</CardTitle>
            <Row className='teacher-menu'>
              <Col xs='4'><h3>My Assignments</h3></Col>
              <Col xs='6' />
              <Col xs='2'><Link to='/teacher/categories'><Button className='inline-button'>Go to my assignments</Button></Link></Col>
              <Col xs='4'><p>Added {this.state.assignmentsAmount} assignments.</p></Col>
            </Row>
            <Row className='teacher-menu'>
              <Col xs='4'><h3>My Students</h3></Col>
              <Col xs='6' />
              <Col xs='2'><Link to='/teacher/my-students'><Button className='inline-button'>Go to my students</Button></Link></Col>
              <Col xs='4'><p>Approved {this.state.studentsAmount} students.</p></Col>
            </Row>
            <Row className='teacher-menu'>
              <Col xs='4'><h3>Unapproved Students</h3></Col>
              <Col xs='6' />
              <Col xs='2'><Link to='/teacher/approve-students'><Button color={this.state.unapprovedUsersAmount > 0 ? 'success' : 'secondary'} className='inline-button'>Approve students</Button></Link></Col>
              <Col xs='4'><p>There is {this.state.unapprovedUsersAmount} unapproved students.</p></Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
    </Col></Row>)
  }
}

export default Teacher

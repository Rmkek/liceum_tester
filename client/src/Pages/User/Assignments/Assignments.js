import React, { Component } from 'react'
import { Col, Container, Card, CardTitle, CardGroup, CardBody } from 'reactstrap'
import './Assignments.css'
import { Redirect } from 'react-router-dom'

class Assignments extends Component {
  constructor () {
    super()

    this.state = {
      assignments: '',
      keyIter: -1,
      assignments_json: {},
      full_name: '',
      redirect: false,
      redirect_url: ''
    }
  }

  componentDidMount () {
    console.log('state: ', this.props.location.state.category)
    window.fetch(`/api/assignments`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        category: this.props.location.state.category
      })
    })
      .then(response => {
        if (response.redirected) {
          this.setState({
            redirect_url: response.url.substring(response.url.lastIndexOf('/'), response.url.length),
            redirect: true
          })
        } else {
          response.json().then(json => {
            console.log('json: ', json)
            let assignmentArray = []
            json.forEach(element => {
              assignmentArray.push(this.renderCategory(element))
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
                  assignments_json: json,
                  assignments: assignmentArray,
                  full_name: json.name
                })
              })
          })
        }
      })
  };

  renderCategory = (elem) => {
    this.setState({ keyIter: ++this.state.keyIter })
    return (
      <Col xs={2} key={this.state.keyIter} className='category__container'>
        {/* <Link className='assignment__link' to={{
          pathname: `/${window.location.href.split('/')[3]}/assignments/${encodeURI(category.value)}`,
          state: { category: category.value }
        }}> */}
        <Card >
          <CardBody className='category__body'>
            <CardTitle>{elem.name}</CardTitle>
          </CardBody>
        </Card>
        {/* </Link> */}
      </Col>
    )
  }

  renderAssignment (elem) {
    // this.setState({ keyIter: ++this.state.keyIter })
    // return (
    //   <Col xs={2} key={this.state.keyIter} className='category__container'>
    //     <Link to={`/${window.location.href.split('/')[3]}/assignments/${encodeURI(category.value)}`} className='assignment__link'>
    //       <Card >
    //         <CardBody className='category__body'>
    //           <CardTitle>{category.value.toUpperCase()}</CardTitle>
    //         </CardBody>
    //       </Card>
    //     </Link>
    //   </Col>
    // )
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
      <div>
        <Col xs={12}>
          <Container className='assignment-container'>
            <h1 className='alert-heading alert__h1'>Your assignments</h1>
            <small className='alert-heading logged_in'>Logged in as {this.state.full_name}</small>
            <CardGroup className='border--blue assignment-link'>{this.state.assignments}</CardGroup>
          </Container>
        </Col>
      </div>
    )
  }
}

export default Assignments

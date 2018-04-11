import React, { Component } from 'react'
import { Col, Card, CardTitle, CardBody } from 'reactstrap'
import Categories from '../../../Reusables/Categories/Categories'
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
    window.fetch('/api/get-info', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    }).then(response => {
      console.log(response)
      if (response.redirected) {
        this.setState({
          redirect_url: response.url.substring(response.url.lastIndexOf('/'), response.url.length),
          redirect: true
        })
      } else {
        response.json().then(json => {
          this.setState({
            full_name: json.name,
            categories: json.categories
          })
        })
      }
    })
  }

  renderCategory = (elem) => {
    this.setState({ keyIter: ++this.state.keyIter })
    return (
      <Col xs={2} key={this.state.keyIter} className='category__container'>
        <Card >
          <CardBody className='category__body'>
            <CardTitle>{elem.name}</CardTitle>
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
      <Categories full_name={this.state.full_name} isTeacher={false} />
    )
  }
}

export default Assignments

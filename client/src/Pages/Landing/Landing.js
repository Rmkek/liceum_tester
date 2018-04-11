import React, { Component } from 'react'
import { Container, Button, Row, Col } from 'reactstrap'
import { Link } from 'react-router-dom'
import * as AUTH_CONSTANTS from '../../Backend_answers/AuthConstants'
import './Landing.css'

class Landing extends Component {
  constructor (props) {
    super(props)

    window.fetch(`api/checkForLogin`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    })
      .then(response => {
        console.log('resp: ', response)
        if (response.redirected) {
          console.log('Successfully logged in.')
          this.setState({
            is_loading: false,
            redirect: true,
            redirect_url: response.url.substring(response.url.lastIndexOf('/'), response.url.length) })
        } else {
          response.json().then(resp => {
            if (resp === AUTH_CONSTANTS.NOT_LOGGED_IN) {
              console.log('Not logged in')
            }
          })
        }
      })
  }

  render () {
    return <Container>
      <Row className='vertical-center'>
        <Col xl={{size: 4, offset: 4}} lg={{ size: 4, offset: 4 }} md={{ size: 5, offset: 4 }} sm={{size: 6, offset: 3}} xs={{size: 8, offset: 2}} className='choice-container'>
          <h1 className='center-heading'>Would you rather</h1>
          <Link to='/register-user' className='choice-link'>
            <Button color='primary' size='md' block className='choice-button'>
           Register as user
            </Button>
          </Link>
          <Link to='/register-teacher' className='choice-link'>
            <Button color='primary' size='md' block className='choice-button'>
            Register as teacher
            </Button>
          </Link>
          <Link to='/login' className='choice-link'>
            <Button color='primary' size='md' block className='choice-button'>
            Log in
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  }
}

export default Landing

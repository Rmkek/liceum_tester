import React, { Component } from 'react'
import { Container, Row } from 'reactstrap'
import './Spinner.css'

class Spinner extends Component {
  render () {
    return (
      <Container>
        <Row>
          <div id='loader'>
            <div className='dot' />
            <div className='dot' />
            <div className='dot' />
            <div className='dot' />
            <div className='dot' />
            <div className='dot' />
            <div className='dot' />
            <div className='dot' />
            <div className='loading' />
          </div>
        </Row>
      </Container>
    )
  }
}

export default Spinner

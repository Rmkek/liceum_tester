import React, { Component } from 'react';
import {Col, Row } from 'react-bootstrap';

class Assignment extends Component {
    constructor() {
        super()

        let style = {
            position: 'absolute',
            background: 'white'
        }
    }

    render() {
        return (
            <Col xs={12} md={12} style={this.style}>
                <Row>
                <form ref='uploadForm' 
                      id='uploadForm' 
                      action='http://localhost:3001/api/upload-code/' 
                      method='POST' 
                      encType="multipart/form-data">
                    <input type="file" name="sampleFile" />
                    <input type='submit' value='Upload!' />
                </form>     
                </Row>
            </Col>
        )
  }
}

export default Assignment;
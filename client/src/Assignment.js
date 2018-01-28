import React, { Component } from 'react';
import {Col, Row, Table} from 'react-bootstrap';
import * as ASSIGNMENT_CONSTANTS from './Backend_answers/AssignmentConstants'
import './Assignment.css'

class Assignment extends Component {
    constructor(props) {
        super(props)

        this.state = {
            assignments: null
        }

        let assignment_pack_name = this.props.location.pathname.substring(this.props.location.pathname.lastIndexOf('/') + 1,
                                                                          this.props.location.pathname.length)
        
        fetch(`http://localhost:3000/api/getAssignmentPack?name=${assignment_pack_name}`, {
            accept: "application/json",
            credentials: 'include'
        })
        .then((response) => response.json())
        .then((json) => {
            if (json.error && json.error === ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT) {
                console.log('no such assignment')
                //TODO add proper error showcase
            }

            if (json) {
                this.setState({assignments: json.tasks})
                console.log(this.state)
            }
            // GET_ASSIGNMENT_CONSTS.NO_SUCH_ASSIGNMENT
        })
    }
    //TODO: customize with css
    
    render() {
        return (this.state.assignments != null ? 
        <Col xs={6}>
            <Row>
                <Table bordered striped hover condensed>
                    <thead className='table_color_fix'>
                        <tr>
                            <th>Assignment</th>
                            <th>Send solution</th>
                        </tr>
                    </thead>

                    <tbody className='table_color_fix'  >                        
                            {this.state.assignments.map(element =>
                                 <tr>
                                 <td key={element.name}>{element.name}</td>
                                 <td><a href=''>TEST</a></td>
                                 </tr>                        
                            )}
                    </tbody>
                </Table>
            </Row>
        </Col> : ''
        )
  }
}

export default Assignment;
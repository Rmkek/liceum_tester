import React, { Component } from 'react';
import { Thumbnail, Col, Row } from 'react-bootstrap';
import './Assignments.css'
import { Redirect } from 'react-router-dom'
import * as ASSIGNMENT_CONSTANTS from './Backend_answers/AssignmentConstants'

let assignment_link = '', assignment_pack_name = ''
class Assignments extends Component {
    constructor() {
        super()
        
        this.state = {
            assignments: '',
            keyIter: -1,
            assignment_clicked: false,
            assignment_pack_name: ''
        }
    }

    componentDidMount = () => {
        fetch(`api/assignments`, {
            accept: "application/json",
            credentials: 'include'
        })
        .then((response) => response.json())
        .then((json) => {
            let assignmentArray = []
            json.assignments.forEach(element => {
                assignmentArray.push(this.renderAssignment(element))
            });
            this.setState({assignments: assignmentArray})
        })
    }

    handleClickOnAssignment = (e) => {
        e.preventDefault()
        if (e.target.className === 'caption') {
            assignment_pack_name = e.target.firstChild.innerText
        } else if (e.target.tagName === 'H3') {
            assignment_pack_name = e.target.innerText
        } else if (e.target.className === 'assignment__thumbnail thumbnail') {
            assignment_pack_name = e.target.childNodes[1].firstChild.innerText
        } else {
            // this is bad
            this.state.assignments.forEach(elem => {
               if (elem.props.children.props.children[1].props.children === e.target.innerText) {
                    assignment_pack_name = elem.props.children.props.children[0].props.children
                }
            })
        }

        fetch(`api/getAssignmentPack?name=${assignment_pack_name}`, {
            accept: "application/json",
            credentials: 'include'
        })
        .then((response) => response.json())
        .then((json) => {
            console.log('JSON:', json)
            if (json.error && json.error === ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT) {
                console.log('no such assignment')
                //TODO add proper error showcase
            }
            if (json.pdfPath) {
                assignment_link = '/assignment/' + encodeURI(assignment_pack_name)
                    this.setState({assignment_clicked: true})
            }
            // GET_ASSIGNMENT_CONSTS.NO_SUCH_ASSIGNMENT
        })
        
    }

    renderAssignment = (elem) => {
        this.setState({keyIter: ++this.state.keyIter})
        return (
            <Col key={this.state.keyIter} lg={2} md={2} xs={2}>
                <Thumbnail className="assignment__thumbnail" onClick={this.handleClickOnAssignment}>
                    <h3>{elem.name}</h3>
                    <p>{elem.category}</p>
                </Thumbnail>
            </Col>
        )
      }

    render() {
        return (
            !this.state.assignment_clicked ?
            <Col xs={12} md={12} style={this.style}>
                <Row>
                    {this.state.assignments}
                </Row>
            </Col> : (<Redirect to={assignment_link} />)
        )
  }
}

export default Assignments;

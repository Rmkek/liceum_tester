import React, { Component } from 'react'
import { Table, Button, Row, Col, Container, Alert } from 'reactstrap'
import Spinner from '../../../Reusables/Spinner/Spinner'
import './ApproveStudents.css'

let keyIter = 0

class ApproveStudents extends Component {
  constructor () {
    super()

    this.state = {
      table_body: <tr />,
      users_in_table: 0,
      is_loading: true
    }

    window.fetch(`/api/getNotApprovedUsers`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    })
      .then(response => response.json())
      .then(resp => {
        console.log('get not approved users: ', resp)
        let users = []
        resp.forEach(element => {
          console.log('in foreach, element: ', element)
          users.push(this.renderTableRow(element))
        }, this)
        this.setState({ table_body: users,
          is_loading: false })
      })

    this.approveStudent = this.approveStudent.bind(this)
    this.removeStudent = this.removeStudent.bind(this)
  }

  approveStudent = (event) => {
    for (let i = 0; i < this.state.table_body.length; i++) {
      let each = this.state.table_body[i]
      if (each.key === event.target.getAttribute('index')) {
        let email = each.props.children[1].props.children

        window.fetch(`/api/approveUser`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          method: 'POST',
          body: JSON.stringify({
            email
          })
        }).then(response => {
          if (response.status >= 200 && response.status < 300) {
            this.state.table_body.splice(i, 1)
            this.setState({
              users_in_table: --this.state.users_in_table
            })
            this.setState({ table_body: this.state.table_body })
          }
        })
      }
    }
  };

  removeStudent = (event) => {
    for (let i = 0; i < this.state.table_body.length; i++) {
      let each = this.state.table_body[i]
      if (each.key === event.target.getAttribute('index')) {
        let email = each.props.children[1].props.children
        window.fetch(`/api/remove-user`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          method: 'POST',
          body: JSON.stringify({
            email
          })
        }).then(response => {
          if (response.status >= 200 && response.status < 300) {
            console.log('resp: ', response)
            this.state.table_body.splice(i, 1)
            this.setState({
              users_in_table: --this.state.users_in_table
            })
            this.setState({ table_body: this.state.table_body })
          }
        })
      }
    }
  }

  renderTableRow = (elem) => {
    this.setState({
      users_in_table: ++this.state.users_in_table
    })
    ++keyIter
    return (
      <tr key={keyIter}>
        <td>{elem.full_name}</td>
        <td>{elem.email}</td>
        <td>
          <Row>
            <Col xs={{size: 2}}>
              <Button color='success' onClick={this.approveStudent} index={keyIter}>
            Approve
              </Button>
            </Col>
            <Col xs={{offset: 7, size: 2}}>
              <Button color='danger' onClick={this.removeStudent} index={keyIter}>
                <i className='fa fa-trash trash-button' />
              </Button>
            </Col>
          </Row>
        </td>
      </tr>
    )
  };

  render () {
    return this.state.is_loading ? <Spinner />
      : <Row>
        <Col xs='12'>
          <Container className='students__container'>
            <Table bordered hover>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>E-mail</th>
                  <th>Approve</th>
                </tr>
              </thead>
              <tbody>{this.state.users_in_table === 0 ? <tr><td colSpan={3}><Alert color='success'>No users to approve.</Alert></td></tr> : this.state.table_body}</tbody>
            </Table>
          </Container>
        </Col>
      </Row>
  }
}

export default ApproveStudents

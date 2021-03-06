import React, { Component } from 'react'
import { Table, Button } from 'reactstrap'
import Spinner from '../../Reusables/Spinner/Spinner'
import './Admin.css'

let keyIter = 0

class Admin extends Component {
  constructor () {
    super()

    this.state = {
      table_body: <tr />,
      users_in_table: 0,
      is_loading: true
    }

    window.fetch(`api/getNotApprovedTeachers`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    })
      .then(response => response.json())
      .then(resp => {
        console.log('get not approved teachers: ', resp)
        let users = []
        resp.forEach(element => {
          users.push(this.renderTableRow(element))
        }, this)
        this.setState({ table_body: users,
          is_loading: false })
      })

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange = (event) => {
    for (let i = 0; i < this.state.table_body.length; i++) {
      let each = this.state.table_body[i]
      if (each.key === event.target.getAttribute('index')) {
        let email = each.props.children[1].props.children

        window.fetch(`api/approveUser`, {
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

  renderTableRow = (email) => {
    this.setState({
      users_in_table: ++this.state.users_in_table
    })
    ++keyIter
    return (
      <tr key={keyIter}>
        <td>{this.state.users_in_table}</td>
        <td>{email}</td>
        <td>
          <Button onClick={this.handleChange} index={keyIter}>
            {' '}
            Approve{' '}
          </Button>
        </td>
      </tr>
    )
  };

  render () {
    // this shows table for a split second
    return this.state.is_loading ? <Spinner />
      : <Table bordered hover>
        <thead>
          <tr>
            <th>№</th>
            <th>E-mail</th>
            <th>Approve</th>
          </tr>
        </thead>
        <tbody>{this.state.table_body}</tbody>
      </Table>
  }
}

export default Admin

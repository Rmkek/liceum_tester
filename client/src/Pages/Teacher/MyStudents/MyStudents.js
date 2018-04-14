import React, { Component } from 'react'
import { Table, Row, Col, Container, Alert } from 'reactstrap'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import Spinner from '../../../Reusables/Spinner/Spinner'
import './MyStudents.css'

let studentsIter = -1

class MyStudents extends Component {
  constructor () {
    super()

    this.state = {
      users_in_table: 0,
      is_loading: true,
      students: '',
      value: undefined,
      options: [],
      has_no_categories: false
    }

    window.fetch(`/api/get-teacher-students`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    })
      .then(response => response.json())
      .then(resp => {
        console.log('students: ', resp)
        if (resp.length === 0) {
          this.setState({has_no_categories: true, is_loading: false})
        } else {
          this.setState({ students: resp })

          window.fetch('/api/get-teacher-categories', {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            method: 'POST'
          })
            .then(response => response.json())
            .then(resp => {
              console.log('MyStudents.js, categories: ', resp)
              if (resp.categories.length === 0) {
                this.setState({has_no_categories: true, is_loading: false})
                console.log('curstate: ', this.state)
              } else {
                this.setState({ options: resp.categories,
                  is_loading: false })
              }
            }
            )
        }
      })

    this.removeStudent = this.removeStudent.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  updateCategories = (categories, email) => {
    console.log('throwing api request')
    window.fetch(`/api/update-student-categories`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        categories: categories,
        email: email
      })
    })
      .then(response => {
        console.log(response)
      })
  }

  handleChange = (value, email) => {
    console.log('value: ', value)
    console.log('email: ', email)
    let newState = []
    for (let i = 0; i < this.state.students.length; i++) {
      if (this.state.students[i].email === email) {
        let simplifiedCategories = value.map(e => e.value)
        newState.push({full_name: this.state.students[i].full_name, email: this.state.students[i].email, categories: simplifiedCategories})
        this.updateCategories(simplifiedCategories, email)
      } else {
        newState.push(this.state.students[i])
      }
    }

    this.setState({students: newState})
  }

  removeStudent = (event) => {
    // Fixme
    for (let i = 0; i < this.state.students.length; i++) {
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
            this.setState({ users_in_table: --this.state.users_in_table,
              table_body: this.state.table_body })
          }
        })
      }
    }
  }

  // table should take full page.
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
                  <th>Categories</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.has_no_categories ? <tr><td colSpan={3}><Alert color='danger'>No students approved. Try approving some students first.</Alert></td></tr>
                    : this.state.students.map(e => {
                      ++studentsIter
                      return (
                        <tr key={studentsIter} name={`categories-${e.email}`} ref={`categories-${e.email}`}>
                          <td>{e.full_name}</td>
                          <td>{e.email}</td>
                          <td>
                            <Select
                              name={`categories-${e.email}`}
                              multi
                              placeholder='Select a few...'
                              value={e.categories}
                              // onChange={(val) => this.handleChange(val, e.email)}
                              onChange={(value) => this.handleChange(value, e.email)}
                              options={this.state.options}
                            />
                          </td>

                        </tr>
                      )
                    })
                }
              </tbody>
            </Table>
          </Container>
        </Col>
      </Row>
  }
}

export default MyStudents

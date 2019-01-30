import React, { Component } from 'react'
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap'
import { Redirect } from 'react-router-dom'
import './TeacherNavBar.css'

class TeacherNavBar extends Component {
  constructor () {
    super()

    this.state = {
      redirected: false
    }
  }

  logout = (e) => {
    console.log('logging out...', e)

    window.fetch('/api/logout', {
      credentials: 'include',
      method: 'POST'
    })
      .then(() => {
        this.setState({redirected: true})
      })
      .catch(err => {
        console.log('err: ', err)
      })
  }

  render () {
    return this.state.redirected ? <Redirect to='/' /> : (
      <Navbar color='faded' light expand='md'>
        <NavbarBrand href='/teacher'>TestMyCode Teacher Panel</NavbarBrand>
        <Nav className='ml-auto' navbar>
          <NavItem>
            <NavLink href='/teacher'>My Profile</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/my-students'>My Students</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/categories'>My Assignments</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/add-assignments/'>Add Assignments</NavLink>
          </NavItem>
          <NavItem>
            <i className='fas fa-sign-out-alt logout-button' onClick={this.logout} />
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default TeacherNavBar

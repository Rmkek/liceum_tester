import React, { Component } from 'react'
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap'

class TeacherNavBar extends Component {
  render () {
    return (
      <Navbar color='faded' light expand='md'>
        <NavbarBrand href='/teacher'>Liceum Tester Admin Panel</NavbarBrand>
        <Nav className='ml-auto' navbar>
          <NavItem>
            <NavLink href='/teacher/add-assignments/'>Add assignments</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/approve-students/'>Approve students</NavLink>
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default TeacherNavBar
